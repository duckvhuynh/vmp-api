import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, SortOrder, Types } from 'mongoose';
import {
  SimpleDriver,
  SimpleDriverDocument,
  DriverStatus,
  DriverAvailability,
} from '../schemas/simple-driver.schema';
import {
  SimpleBooking,
  SimpleBookingDocument,
  BookingStatus,
} from '../../bookings/schemas/simple-booking.schema';
import {
  DriverQueryDto,
  CreateDriverDto,
  UpdateDriverDto,
  DriverListResponseDto,
  DriverListItemDto,
  DriverDetailResponseDto,
  DriverStatsOverviewDto,
  NearbyDriverDto,
  NearbyDriversQueryDto,
} from '../dto/admin-driver.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminDriversService {
  private readonly logger = new Logger(AdminDriversService.name);

  constructor(
    @InjectModel(SimpleDriver.name)
    private driverModel: Model<SimpleDriverDocument>,
    @InjectModel(SimpleBooking.name)
    private bookingModel: Model<SimpleBookingDocument>,
  ) {}

  /**
   * Get all drivers with filtering and pagination
   */
  async findAll(query: DriverQueryDto): Promise<DriverListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      availability,
      vehicleType,
      isActive,
      isVerified,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: FilterQuery<SimpleDriverDocument> = {};

    // Search filter
    if (search) {
      filter.$or = [
        { driverId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filters
    if (status) filter.status = status;
    if (availability) filter.availability = availability;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (isActive !== undefined) filter.isActive = isActive;
    if (isVerified !== undefined) filter.isVerified = isVerified;
    if (minRating !== undefined) filter.rating = { $gte: minRating };

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [drivers, total] = await Promise.all([
      this.driverModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.driverModel.countDocuments(filter).exec(),
    ]);

    return {
      drivers: drivers.map((driver) => this.mapToListItem(driver)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single driver by ID
   */
  async findOne(id: string): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);
    return this.mapToDetail(driver);
  }

  /**
   * Create a new driver
   */
  async create(dto: CreateDriverDto): Promise<DriverDetailResponseDto> {
    // Check for existing email or license plate
    const existing = await this.driverModel.findOne({
      $or: [{ email: dto.email }, { licensePlate: dto.licensePlate }],
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException(`Driver with email ${dto.email} already exists`);
      }
      throw new ConflictException(`Driver with license plate ${dto.licensePlate} already exists`);
    }

    const driverId = `DRV-${Date.now().toString(36).toUpperCase()}-${randomUUID().substring(0, 6).toUpperCase()}`;

    const driver = new this.driverModel({
      driverId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      vehicleMake: dto.vehicleMake,
      vehicleModel: dto.vehicleModel,
      vehicleYear: dto.vehicleYear,
      vehicleColor: dto.vehicleColor,
      licensePlate: dto.licensePlate,
      vehicleType: dto.vehicleType,
      capacity: dto.capacity,
      luggageCapacity: dto.luggageCapacity,
      status: dto.status || DriverStatus.OFFLINE,
      availability: DriverAvailability.UNAVAILABLE,
      isActive: dto.isActive ?? true,
      isVerified: dto.isVerified ?? false,
      totalTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      totalEarnings: 0,
      rating: 0,
      totalRatings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await driver.save();
    this.logger.log(`Created new driver: ${driverId} (${dto.email})`);

    return this.mapToDetail(driver);
  }

  /**
   * Update a driver
   */
  async update(id: string, dto: UpdateDriverDto): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    // Check for duplicate email or license plate if being changed
    if (dto.email && dto.email !== driver.email) {
      const existingEmail = await this.driverModel.findOne({ email: dto.email });
      if (existingEmail) {
        throw new ConflictException(`Driver with email ${dto.email} already exists`);
      }
    }

    if (dto.licensePlate && dto.licensePlate !== driver.licensePlate) {
      const existingPlate = await this.driverModel.findOne({
        licensePlate: dto.licensePlate,
      });
      if (existingPlate) {
        throw new ConflictException(
          `Driver with license plate ${dto.licensePlate} already exists`,
        );
      }
    }

    // Update fields
    Object.assign(driver, {
      ...dto,
      updatedAt: new Date(),
    });

    await driver.save();
    this.logger.log(`Updated driver: ${driver.driverId}`);

    return this.mapToDetail(driver);
  }

  /**
   * Delete a driver (soft delete by deactivating)
   */
  async delete(id: string): Promise<void> {
    const driver = await this.findDriverById(id);

    // Check if driver has active bookings
    const activeBooking = await this.bookingModel.findOne({
      assignedDriver: driver._id,
      status: {
        $in: [
          BookingStatus.DRIVER_ASSIGNED,
          BookingStatus.EN_ROUTE,
          BookingStatus.ARRIVED,
          BookingStatus.WAITING,
          BookingStatus.ON_TRIP,
        ],
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete driver with active bookings. Please reassign or complete bookings first.',
      );
    }

    // Soft delete by deactivating
    driver.isActive = false;
    driver.status = DriverStatus.OFFLINE;
    driver.availability = DriverAvailability.UNAVAILABLE;
    driver.updatedAt = new Date();

    await driver.save();
    this.logger.log(`Deactivated driver: ${driver.driverId}`);
  }

  /**
   * Permanently delete a driver
   */
  async permanentDelete(id: string): Promise<void> {
    const driver = await this.findDriverById(id);

    // Check if driver has any bookings
    const hasBookings = await this.bookingModel.exists({
      assignedDriver: driver._id,
    });

    if (hasBookings) {
      throw new BadRequestException(
        'Cannot permanently delete driver with booking history. Use deactivate instead.',
      );
    }

    await this.driverModel.deleteOne({ _id: driver._id });
    this.logger.log(`Permanently deleted driver: ${driver.driverId}`);
  }

  /**
   * Update driver status
   */
  async updateStatus(id: string, status: DriverStatus, reason?: string): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    // If going offline, check for active bookings
    if (status === DriverStatus.OFFLINE && driver.status !== DriverStatus.OFFLINE) {
      const activeBooking = await this.bookingModel.findOne({
        assignedDriver: driver._id,
        status: {
          $in: [
            BookingStatus.EN_ROUTE,
            BookingStatus.ARRIVED,
            BookingStatus.WAITING,
            BookingStatus.ON_TRIP,
          ],
        },
      });

      if (activeBooking) {
        throw new BadRequestException(
          'Cannot set driver offline while they have an active trip',
        );
      }
    }

    driver.status = status;

    // Update availability based on status
    if (status === DriverStatus.OFFLINE) {
      driver.availability = DriverAvailability.UNAVAILABLE;
    } else if (status === DriverStatus.ON_BREAK) {
      driver.availability = DriverAvailability.UNAVAILABLE;
    } else if (status === DriverStatus.ONLINE && driver.availability === DriverAvailability.UNAVAILABLE) {
      driver.availability = DriverAvailability.AVAILABLE;
    }

    driver.updatedAt = new Date();
    await driver.save();

    this.logger.log(
      `Updated driver ${driver.driverId} status to ${status}${reason ? `: ${reason}` : ''}`,
    );

    return this.mapToDetail(driver);
  }

  /**
   * Update driver availability
   */
  async updateAvailability(
    id: string,
    availability: DriverAvailability,
    reason?: string,
  ): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    if (driver.status === DriverStatus.OFFLINE && availability !== DriverAvailability.UNAVAILABLE) {
      throw new BadRequestException('Cannot change availability while driver is offline');
    }

    driver.availability = availability;
    driver.updatedAt = new Date();
    await driver.save();

    this.logger.log(
      `Updated driver ${driver.driverId} availability to ${availability}${reason ? `: ${reason}` : ''}`,
    );

    return this.mapToDetail(driver);
  }

  /**
   * Activate or deactivate a driver
   */
  async setActive(id: string, isActive: boolean, reason?: string): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    if (!isActive) {
      // If deactivating, check for active bookings
      const activeBooking = await this.bookingModel.findOne({
        assignedDriver: driver._id,
        status: {
          $in: [
            BookingStatus.DRIVER_ASSIGNED,
            BookingStatus.EN_ROUTE,
            BookingStatus.ARRIVED,
            BookingStatus.WAITING,
            BookingStatus.ON_TRIP,
          ],
        },
      });

      if (activeBooking) {
        throw new BadRequestException(
          'Cannot deactivate driver with active bookings',
        );
      }

      // Set offline when deactivating
      driver.status = DriverStatus.OFFLINE;
      driver.availability = DriverAvailability.UNAVAILABLE;
    }

    driver.isActive = isActive;
    driver.updatedAt = new Date();
    await driver.save();

    this.logger.log(
      `${isActive ? 'Activated' : 'Deactivated'} driver ${driver.driverId}${reason ? `: ${reason}` : ''}`,
    );

    return this.mapToDetail(driver);
  }

  /**
   * Verify or unverify a driver
   */
  async setVerified(id: string, isVerified: boolean, notes?: string): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    driver.isVerified = isVerified;
    driver.updatedAt = new Date();
    await driver.save();

    this.logger.log(
      `${isVerified ? 'Verified' : 'Unverified'} driver ${driver.driverId}${notes ? `: ${notes}` : ''}`,
    );

    return this.mapToDetail(driver);
  }

  /**
   * Update driver location (admin override)
   */
  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
    address?: string,
  ): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    driver.latitude = latitude;
    driver.longitude = longitude;
    driver.address = address;
    driver.lastLocationUpdate = new Date();
    driver.updatedAt = new Date();

    await driver.save();
    this.logger.log(`Updated location for driver ${driver.driverId}`);

    return this.mapToDetail(driver);
  }

  /**
   * Update driver vehicle information
   */
  async updateVehicle(
    id: string,
    vehicleData: Partial<{
      vehicleMake: string;
      vehicleModel: string;
      vehicleYear: string;
      vehicleColor: string;
      licensePlate: string;
      vehicleType: string;
      capacity: number;
      luggageCapacity: number;
    }>,
  ): Promise<DriverDetailResponseDto> {
    const driver = await this.findDriverById(id);

    // Check for duplicate license plate if being changed
    if (vehicleData.licensePlate && vehicleData.licensePlate !== driver.licensePlate) {
      const existingPlate = await this.driverModel.findOne({
        licensePlate: vehicleData.licensePlate,
      });
      if (existingPlate) {
        throw new ConflictException(
          `Driver with license plate ${vehicleData.licensePlate} already exists`,
        );
      }
    }

    Object.assign(driver, vehicleData, { updatedAt: new Date() });
    await driver.save();

    this.logger.log(`Updated vehicle for driver ${driver.driverId}`);

    return this.mapToDetail(driver);
  }

  /**
   * Get driver statistics overview
   */
  async getStats(): Promise<DriverStatsOverviewDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDrivers,
      activeDrivers,
      verifiedDrivers,
      statusCounts,
      vehicleTypeCounts,
      ratingAvg,
      monthlyTrips,
      monthlyEarnings,
    ] = await Promise.all([
      this.driverModel.countDocuments(),
      this.driverModel.countDocuments({ isActive: true }),
      this.driverModel.countDocuments({ isVerified: true }),
      this.driverModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.driverModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      ]),
      this.driverModel.aggregate([
        { $match: { totalRatings: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
      this.bookingModel.countDocuments({
        status: BookingStatus.COMPLETED,
        actualDropoffAt: { $gte: startOfMonth },
      }),
      this.bookingModel.aggregate([
        {
          $match: {
            status: BookingStatus.COMPLETED,
            actualDropoffAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((item: { _id: string; count: number }) => {
      byStatus[item._id] = item.count;
    });

    const byVehicleType: Record<string, number> = {};
    vehicleTypeCounts.forEach((item: { _id: string; count: number }) => {
      byVehicleType[item._id] = item.count;
    });

    const onlineDrivers = byStatus[DriverStatus.ONLINE] || 0;
    const busyDrivers = byStatus[DriverStatus.BUSY] || 0;
    const offlineDrivers = byStatus[DriverStatus.OFFLINE] || 0;

    // Count available drivers
    const availableDrivers = await this.driverModel.countDocuments({
      status: DriverStatus.ONLINE,
      availability: DriverAvailability.AVAILABLE,
      isActive: true,
    });

    return {
      totalDrivers,
      activeDrivers,
      verifiedDrivers,
      onlineDrivers,
      availableDrivers,
      busyDrivers,
      offlineDrivers,
      averageRating: ratingAvg[0]?.avgRating || 0,
      totalTripsThisMonth: monthlyTrips,
      totalEarningsThisMonth: monthlyEarnings[0]?.total || 0,
      byStatus,
      byVehicleType,
    };
  }

  /**
   * Find nearby available drivers
   */
  async findNearbyDrivers(query: NearbyDriversQueryDto): Promise<NearbyDriverDto[]> {
    const { latitude, longitude, radiusKm = 10, vehicleType, limit = 10 } = query;

    const filter: FilterQuery<SimpleDriverDocument> = {
      status: DriverStatus.ONLINE,
      availability: DriverAvailability.AVAILABLE,
      isActive: true,
      isVerified: true,
      latitude: { $exists: true },
      longitude: { $exists: true },
    };

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    // Get all matching drivers and calculate distance client-side
    // (For proper geo queries, you'd need a 2dsphere index on a location field)
    const drivers = await this.driverModel.find(filter).limit(limit * 3).exec();

    // Calculate distance and filter by radius
    const driversWithDistance = drivers
      .map((driver) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          driver.latitude!,
          driver.longitude!,
        );
        return { driver, distance };
      })
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return driversWithDistance.map(({ driver, distance }) => ({
      _id: driver._id.toString(),
      driverId: driver.driverId,
      name: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone,
      vehicle: {
        make: driver.vehicleMake,
        model: driver.vehicleModel,
        year: driver.vehicleYear,
        color: driver.vehicleColor,
        licensePlate: driver.licensePlate,
        type: driver.vehicleType,
        capacity: driver.capacity,
        luggageCapacity: driver.luggageCapacity,
      },
      location: {
        latitude: driver.latitude!,
        longitude: driver.longitude!,
        address: driver.address,
        lastUpdated: driver.lastLocationUpdate,
      },
      distance: Math.round(distance * 100) / 100,
      rating: driver.rating,
      totalTrips: driver.totalTrips,
    }));
  }

  /**
   * Get driver's booking history
   */
  async getDriverBookings(
    id: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ bookings: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const driver = await this.findDriverById(id);

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find({ assignedDriver: driver._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments({ assignedDriver: driver._id }),
    ]);

    return {
      bookings: bookings.map((booking) => ({
        _id: booking._id.toString(),
        bookingId: booking.bookingId,
        status: booking.status,
        passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
        originName: booking.originName || booking.originAddress,
        destinationName: booking.destinationName || booking.destinationAddress,
        pickupAt: booking.pickupAt,
        total: booking.total,
        currency: booking.currency,
        createdAt: booking.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ Private Helper Methods ============

  private async findDriverById(id: string): Promise<SimpleDriverDocument> {
    let driver: SimpleDriverDocument | null = null;

    // Try to find by MongoDB _id first
    if (Types.ObjectId.isValid(id)) {
      driver = await this.driverModel.findById(id).exec();
    }

    // If not found, try by driverId
    if (!driver) {
      driver = await this.driverModel.findOne({ driverId: id }).exec();
    }

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  private mapToListItem(driver: SimpleDriverDocument): DriverListItemDto {
    return {
      _id: driver._id.toString(),
      driverId: driver.driverId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      availability: driver.availability,
      vehicle: {
        make: driver.vehicleMake,
        model: driver.vehicleModel,
        year: driver.vehicleYear,
        color: driver.vehicleColor,
        licensePlate: driver.licensePlate,
        type: driver.vehicleType,
        capacity: driver.capacity,
        luggageCapacity: driver.luggageCapacity,
      },
      rating: driver.rating,
      totalTrips: driver.totalTrips,
      isActive: driver.isActive,
      isVerified: driver.isVerified,
      lastActiveAt: driver.lastActiveAt,
      createdAt: driver.createdAt,
    };
  }

  private mapToDetail(driver: SimpleDriverDocument): DriverDetailResponseDto {
    return {
      ...this.mapToListItem(driver),
      currentLocation:
        driver.latitude && driver.longitude
          ? {
              latitude: driver.latitude,
              longitude: driver.longitude,
              address: driver.address,
              lastUpdated: driver.lastLocationUpdate,
            }
          : undefined,
      stats: {
        totalTrips: driver.totalTrips,
        completedTrips: driver.completedTrips,
        cancelledTrips: driver.cancelledTrips,
        totalEarnings: driver.totalEarnings,
        rating: driver.rating,
        totalRatings: driver.totalRatings,
      },
      currentBookingId: driver.currentBookingId?.toString(),
      updatedAt: driver.updatedAt,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

