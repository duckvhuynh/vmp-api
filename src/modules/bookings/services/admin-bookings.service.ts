import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types, FilterQuery } from 'mongoose';
import { randomUUID, randomBytes } from 'crypto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from '../schemas/simple-booking.schema';
import {
  AdminCreateBookingDto,
  BookingQueryDto,
  UpdateBookingStatusDto,
  AssignDriverDto,
  AutoAssignDriverDto,
  AutoAssignResultDto,
  AdminUpdateBookingDto,
  AdminCancelBookingDto,
  AddBookingEventDto,
  BookingListResponseDto,
  BookingDetailResponseDto,
  BookingStatsDto,
  BookingListItemDto,
} from '../dto/admin-booking.dto';
import { SimpleDriver, SimpleDriverDocument } from '../../drivers/schemas/simple-driver.schema';
import { PlaceDto, PlaceResponseDto, PlaceType, getPlaceDisplayName } from '../../../common/dto/place.dto';
import { VehiclesService } from '../../vehicles/services/vehicles.service';
import { DriverAccessService } from './driver-access.service';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(SimpleDriver.name) private driverModel: Model<SimpleDriverDocument>,
    private readonly vehiclesService: VehiclesService,
    @Inject(forwardRef(() => DriverAccessService))
    private readonly driverAccessService: DriverAccessService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') 
      || this.configService.get<string>('frontendUrl')
      || 'https://visitmauritiusparadise.com';
  }

  /**
   * Generate a short, unique access code (8 alphanumeric characters)
   */
  private async generateUniqueAccessCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const bytes = randomBytes(6);
      const accessCode = bytes.toString('hex').substring(0, 8).toUpperCase();
      
      const existing = await this.bookingModel.findOne({ accessCode }).exec();
      if (!existing) {
        return accessCode;
      }
      attempts++;
    }

    throw new BadRequestException('Failed to generate unique access code');
  }

  /**
   * Create a new booking (admin)
   * Used for phone bookings, walk-in customers, or manual bookings
   */
  async create(dto: AdminCreateBookingDto, adminUserId: string): Promise<BookingDetailResponseDto> {
    this.logger.log(`Admin ${adminUserId} creating booking for ${dto.passengerFirstName} ${dto.passengerLastName}`);

    // Validate - either vehicleId or vehicleClass must be provided
    if (!dto.vehicleId && !dto.vehicleClass) {
      throw new BadRequestException('Either vehicleId or vehicleClass must be provided');
    }

    // Generate unique booking ID
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueId = randomUUID().substring(0, 6).toUpperCase();
    const bookingId = `BK-${dateStr}-${uniqueId}`;

    // Determine initial status
    let status = dto.status || BookingStatus.CONFIRMED;
    if (dto.assignedDriverId) {
      status = BookingStatus.DRIVER_ASSIGNED;
    }

    // Resolve vehicle info from vehicleId if provided
    let vehicleId: Types.ObjectId | undefined;
    let vehicleClass = dto.vehicleClass || '';
    let vehicleName = dto.vehicleName || dto.vehicleClass || '';
    let vehicleCapacity = dto.vehicleCapacity || 4;
    let vehicleBagCapacity = dto.vehicleBagCapacity || 2;

    if (dto.vehicleId) {
      try {
        const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
        vehicleId = new Types.ObjectId(dto.vehicleId);
        vehicleClass = vehicle.category;
        vehicleName = vehicle.name.value || vehicle.name.translations?.en || vehicle.category;
        vehicleCapacity = vehicle.capacity.maxPassengers;
        vehicleBagCapacity = vehicle.capacity.maxLuggage;
        this.logger.log(`Resolved vehicle info from ID ${dto.vehicleId}: ${vehicleName} (${vehicleClass})`);
      } catch (error) {
        throw new BadRequestException(`Vehicle with ID ${dto.vehicleId} not found`);
      }
    }

    // Generate unique access code for customer booking page
    const accessCode = await this.generateUniqueAccessCode();

    // Create booking with consistent PlaceDto structure
    const booking = new this.bookingModel({
      bookingId,
      accessCode,
      status,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : new Types.ObjectId(adminUserId),
      passengerFirstName: dto.passengerFirstName,
      passengerLastName: dto.passengerLastName,
      passengerPhone: dto.passengerPhone,
      // Origin fields from PlaceDto
      originType: dto.origin.type,
      originAirportCode: dto.origin.airportCode,
      originTerminal: dto.origin.terminal,
      originName: dto.origin.name || getPlaceDisplayName(dto.origin),
      originAddress: dto.origin.address,
      originLatitude: dto.origin.latitude,
      originLongitude: dto.origin.longitude,
      originRegionId: dto.origin.regionId ? new Types.ObjectId(dto.origin.regionId) : undefined,
      // Destination fields from PlaceDto
      destinationType: dto.destination.type,
      destinationAirportCode: dto.destination.airportCode,
      destinationTerminal: dto.destination.terminal,
      destinationName: dto.destination.name || getPlaceDisplayName(dto.destination),
      destinationAddress: dto.destination.address,
      destinationLatitude: dto.destination.latitude,
      destinationLongitude: dto.destination.longitude,
      destinationRegionId: dto.destination.regionId ? new Types.ObjectId(dto.destination.regionId) : undefined,
      // Other fields
      pickupAt: new Date(dto.pickupAt),
      flightNumber: dto.flightNumber,
      flightDate: dto.flightDate,
      passengers: dto.passengers,
      luggage: dto.luggage,
      extras: dto.extras || [],
      // Vehicle info (resolved from vehicleId if provided)
      vehicleId,
      vehicleClass,
      vehicleName,
      vehicleCapacity,
      vehicleBagCapacity,
      baseFare: dto.baseFare,
      distanceCharge: dto.distanceCharge,
      timeCharge: dto.timeCharge,
      airportFees: dto.airportFees,
      surcharges: dto.surcharges,
      extrasTotal: dto.extrasTotal,
      total: dto.total,
      currency: dto.currency || 'MUR',
      assignedDriver: dto.assignedDriverId ? new Types.ObjectId(dto.assignedDriverId) : undefined,
      paymentConfirmedAt: dto.paymentConfirmed ? new Date() : undefined,
      paymentMethodId: dto.paymentMethod,
      events: [
        {
          event: BookingEventName.CREATED,
          status,
          timestamp: new Date(),
          description: dto.adminNotes || `Booking created by admin`,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add driver assigned event if driver was assigned
    if (dto.assignedDriverId) {
      booking.events.push({
        event: BookingEventName.DRIVER_ASSIGNED,
        status: BookingStatus.DRIVER_ASSIGNED,
        timestamp: new Date(),
        description: 'Driver assigned by admin during booking creation',
        driverId: new Types.ObjectId(dto.assignedDriverId),
      });
    }

    // Add payment confirmed event if payment was confirmed
    if (dto.paymentConfirmed) {
      booking.events.push({
        event: BookingEventName.PAYMENT_SUCCESS,
        status: booking.status,
        timestamp: new Date(),
        description: `Payment confirmed (${dto.paymentMethod || 'manual'})`,
      });
    }

    await booking.save();

    this.logger.log(`Booking ${bookingId} created successfully`);

    return this.mapToDetail(booking);
  }

  /**
   * Get all bookings with filtering and pagination
   */
  async findAll(query: BookingQueryDto): Promise<BookingListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      driverId,
      userId,
      vehicleClass,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: FilterQuery<SimpleBookingDocument> = {};

    // Search filter
    if (search) {
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { passengerFirstName: { $regex: search, $options: 'i' } },
        { passengerLastName: { $regex: search, $options: 'i' } },
        { passengerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Driver filter
    if (driverId) {
      filter.assignedDriver = new Types.ObjectId(driverId);
    }

    // User filter
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    // Vehicle class filter
    if (vehicleClass) {
      filter.vehicleClass = vehicleClass;
    }

    // Date range filter
    if (fromDate || toDate) {
      filter.pickupAt = {};
      if (fromDate) {
        filter.pickupAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.pickupAt.$lte = new Date(toDate);
      }
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, total] = await Promise.all([
      this.bookingModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Fetch driver names for bookings with assigned drivers
    const driverIds = bookings
      .filter(b => b.assignedDriver)
      .map(b => b.assignedDriver!);
    
    const driverNameMap = new Map<string, string>();
    if (driverIds.length > 0) {
      const drivers = await this.driverModel.find({ _id: { $in: driverIds } }).select('firstName lastName').exec();
      drivers.forEach(driver => {
        driverNameMap.set(driver._id.toString(), `${driver.firstName} ${driver.lastName}`);
      });
    }

    return {
      bookings: bookings.map(booking => this.mapToListItemWithDriver(booking, driverNameMap)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get booking by ID
   */
  async findOne(id: string): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);
    return this.mapToDetail(booking);
  }

  /**
   * Get booking by booking ID (public ID)
   */
  async findByBookingId(bookingId: string): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingModel.findOne({ bookingId }).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }
    return this.mapToDetail(booking);
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    // Validate status transition
    this.validateStatusTransition(booking.status, dto.status);

    // Update status
    booking.status = dto.status;
    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: BookingEventName.STATUS_UPDATE,
      status: dto.status,
      timestamp: new Date(),
      description: dto.reason || `Status changed to ${dto.status}`,
      notes: dto.notes,
    });

    await booking.save();
    return this.mapToDetail(booking);
  }

  /**
   * Assign driver to booking
   */
  async assignDriver(id: string, dto: AssignDriverDto): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    // Validate booking status allows driver assignment
    if (![BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT, BookingStatus.DRIVER_DECLINED].includes(booking.status)) {
      throw new BadRequestException(`Cannot assign driver to booking with status ${booking.status}`);
    }

    // Update booking
    booking.assignedDriver = new Types.ObjectId(dto.driverId);
    booking.status = BookingStatus.DRIVER_ASSIGNED;
    booking.updatedAt = new Date();

    // Update pricing if provided
    if (dto.baseFare !== undefined) booking.baseFare = dto.baseFare;
    if (dto.distanceCharge !== undefined) booking.distanceCharge = dto.distanceCharge;
    if (dto.timeCharge !== undefined) booking.timeCharge = dto.timeCharge;
    if (dto.airportFees !== undefined) booking.airportFees = dto.airportFees;
    if (dto.surcharges !== undefined) booking.surcharges = dto.surcharges;
    if (dto.extrasTotal !== undefined) booking.extrasTotal = dto.extrasTotal;

    // Update total - either use provided total or calculate from components
    if (dto.total !== undefined) {
      booking.total = dto.total;
    } else if (dto.baseFare !== undefined || dto.distanceCharge !== undefined || 
               dto.timeCharge !== undefined || dto.airportFees !== undefined || 
               dto.surcharges !== undefined || dto.extrasTotal !== undefined) {
      // Recalculate total if any pricing component was updated
      booking.total = (booking.baseFare || 0) + 
                      (booking.distanceCharge || 0) + 
                      (booking.timeCharge || 0) + 
                      (booking.airportFees || 0) + 
                      (booking.surcharges || 0) + 
                      (booking.extrasTotal || 0);
    }

    // Handle payment confirmation
    if (dto.paymentConfirmed) {
      booking.paymentConfirmedAt = new Date();
      if (dto.paymentMethod) {
        booking.paymentMethodId = dto.paymentMethod;
      }
    }

    // Generate driver access link (never expires)
    const driverLinkData = this.driverAccessService.generateDriverAccessLink(
      booking.bookingId,
      dto.driverId,
    );

    // Build event description
    let eventDescription = dto.notes || 'Driver assigned by admin';
    if (dto.total !== undefined || dto.baseFare !== undefined) {
      eventDescription += ` (Price: ${booking.total} ${booking.currency})`;
    }
    if (dto.paymentConfirmed) {
      eventDescription += ` - Payment confirmed (${dto.paymentMethod || 'manual'})`;
    }

    // Add event
    booking.events.push({
      event: BookingEventName.DRIVER_ASSIGNED,
      status: BookingStatus.DRIVER_ASSIGNED,
      timestamp: new Date(),
      description: eventDescription,
      driverId: new Types.ObjectId(dto.driverId),
    });

    // Add payment event if confirmed
    if (dto.paymentConfirmed) {
      booking.events.push({
        event: BookingEventName.PAYMENT_SUCCESS,
        status: booking.status,
        timestamp: new Date(),
        description: `Payment confirmed (${dto.paymentMethod || 'manual'}) - ${booking.total} ${booking.currency}`,
      });
    }

    await booking.save();
    
    this.logger.log(`Driver ${dto.driverId} assigned to booking ${booking.bookingId}. Driver link generated (never expires).`);
    
    // Send driver assignment notifications (to driver and customer)
    // Run async without blocking the response
    this.notificationService.onDriverAssigned(
      booking.bookingId,
      dto.driverId,
      driverLinkData.driverLink,
    ).catch((err) => {
      this.logger.error(`Failed to send driver assignment notifications: ${err.message}`);
    });
    
    // Return response with driver link
    const response = this.mapToDetail(booking);
    response.driverLink = driverLinkData.driverLink;
    response.driverAccessToken = driverLinkData.token;
    
    return response;
  }

  /**
   * Auto-assign the best available driver to a booking
   * Finds drivers within radius, sorted by distance
   */
  async autoAssignDriver(id: string, dto: AutoAssignDriverDto): Promise<AutoAssignResultDto> {
    const booking = await this.findBookingById(id);

    // Validate booking status
    if (![BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT, BookingStatus.DRIVER_DECLINED].includes(booking.status)) {
      throw new BadRequestException(`Cannot auto-assign driver to booking with status ${booking.status}`);
    }

    // Check if driver is already assigned
    if (booking.assignedDriver) {
      throw new BadRequestException('Driver is already assigned to this booking. Unassign first or use reassign.');
    }

    // Get pickup location
    const pickupLat = booking.originLatitude;
    const pickupLon = booking.originLongitude;

    if (!pickupLat || !pickupLon) {
      throw new BadRequestException('Booking does not have pickup coordinates for auto-assignment');
    }

    const radiusKm = dto.radiusKm || 10;
    const maxDrivers = dto.maxDrivers || 5;
    const vehicleClass = dto.vehicleClass || booking.vehicleClass;

    // Find available drivers
    const availableDrivers = await this.findAvailableDrivers(
      pickupLat,
      pickupLon,
      radiusKm,
      vehicleClass,
      maxDrivers,
    );

    if (availableDrivers.length === 0) {
      this.logger.warn(`No available drivers found for booking ${booking.bookingId} within ${radiusKm}km`);
      return {
        success: false,
        message: `No available drivers found within ${radiusKm}km radius`,
        driversConsidered: 0,
      };
    }

    // Assign the closest driver
    const selectedDriver = availableDrivers[0];
    const distanceKm = selectedDriver.distance;

    // Update booking
    booking.assignedDriver = selectedDriver.driver._id;
    booking.status = BookingStatus.DRIVER_ASSIGNED;
    booking.updatedAt = new Date();

    // Update pricing if provided
    if (dto.baseFare !== undefined) booking.baseFare = dto.baseFare;
    if (dto.distanceCharge !== undefined) booking.distanceCharge = dto.distanceCharge;
    if (dto.timeCharge !== undefined) booking.timeCharge = dto.timeCharge;
    if (dto.airportFees !== undefined) booking.airportFees = dto.airportFees;
    if (dto.surcharges !== undefined) booking.surcharges = dto.surcharges;
    if (dto.extrasTotal !== undefined) booking.extrasTotal = dto.extrasTotal;

    // Update total
    if (dto.total !== undefined) {
      booking.total = dto.total;
    } else if (dto.baseFare !== undefined || dto.distanceCharge !== undefined || 
               dto.timeCharge !== undefined || dto.airportFees !== undefined || 
               dto.surcharges !== undefined || dto.extrasTotal !== undefined) {
      booking.total = (booking.baseFare || 0) + 
                      (booking.distanceCharge || 0) + 
                      (booking.timeCharge || 0) + 
                      (booking.airportFees || 0) + 
                      (booking.surcharges || 0) + 
                      (booking.extrasTotal || 0);
    }

    // Handle payment confirmation
    if (dto.paymentConfirmed) {
      booking.paymentConfirmedAt = new Date();
      if (dto.paymentMethod) {
        booking.paymentMethodId = dto.paymentMethod;
      }
    }

    // Build event description
    let eventDescription = `Driver auto-assigned: ${selectedDriver.driver.firstName} ${selectedDriver.driver.lastName} (${distanceKm.toFixed(1)}km away)`;
    if (dto.total !== undefined || dto.baseFare !== undefined) {
      eventDescription += ` - Price: ${booking.total} ${booking.currency}`;
    }

    // Add event
    booking.events.push({
      event: BookingEventName.DRIVER_ASSIGNED,
      status: BookingStatus.DRIVER_ASSIGNED,
      timestamp: new Date(),
      description: eventDescription,
      driverId: selectedDriver.driver._id,
    });

    // Add payment event if confirmed
    if (dto.paymentConfirmed) {
      booking.events.push({
        event: BookingEventName.PAYMENT_SUCCESS,
        status: booking.status,
        timestamp: new Date(),
        description: `Payment confirmed (${dto.paymentMethod || 'manual'}) - ${booking.total} ${booking.currency}`,
      });
    }

    await booking.save();

    // Generate driver access link (never expires)
    const driverLinkData = this.driverAccessService.generateDriverAccessLink(
      booking.bookingId,
      selectedDriver.driver._id.toString(),
    );

    this.logger.log(`Auto-assigned driver ${selectedDriver.driver._id} to booking ${booking.bookingId}. Driver link generated (never expires).`);

    // Send driver assignment notifications (to driver and customer)
    // Run async without blocking the response
    this.notificationService.onDriverAssigned(
      booking.bookingId,
      selectedDriver.driver._id.toString(),
      driverLinkData.driverLink,
    ).catch((err) => {
      this.logger.error(`Failed to send driver assignment notifications: ${err.message}`);
    });

    return {
      success: true,
      assignedDriverId: selectedDriver.driver._id.toString(),
      driverName: `${selectedDriver.driver.firstName} ${selectedDriver.driver.lastName}`,
      driverPhone: selectedDriver.driver.phone,
      message: 'Driver auto-assigned successfully',
      driversConsidered: availableDrivers.length,
      distanceKm,
      driverLink: driverLinkData.driverLink,
      driverAccessToken: driverLinkData.token,
    };
  }

  /**
   * Find available drivers within radius
   */
  private async findAvailableDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    vehicleClass: string,
    limit: number,
  ): Promise<Array<{ driver: SimpleDriverDocument; distance: number }>> {
    // Find all online, available, active, verified drivers
    const drivers = await this.driverModel.find({
      status: 'online',
      availability: 'available',
      isActive: true,
      isVerified: true,
    }).exec();

    // Calculate distance and filter by radius
    const driversWithDistance: Array<{ driver: SimpleDriverDocument; distance: number }> = [];

    for (const driver of drivers) {
      if (!driver.latitude || !driver.longitude) continue;

      const distance = this.calculateDistanceKm(
        latitude,
        longitude,
        driver.latitude,
        driver.longitude,
      );

      if (distance <= radiusKm) {
        // Optionally filter by vehicle class if driver has vehicle info
        // For now, include all available drivers
        driversWithDistance.push({ driver, distance });
      }
    }

    // Sort by distance (closest first)
    driversWithDistance.sort((a, b) => a.distance - b.distance);

    // Return limited results
    return driversWithDistance.slice(0, limit);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistanceKm(
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
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Unassign driver from booking
   */
  async unassignDriver(id: string, reason?: string): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    if (!booking.assignedDriver) {
      throw new BadRequestException('No driver assigned to this booking');
    }

    const previousDriverId = booking.assignedDriver;
    booking.assignedDriver = undefined;
    booking.status = BookingStatus.CONFIRMED;
    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: 'driver_unassigned',
      status: BookingStatus.CONFIRMED,
      timestamp: new Date(),
      description: reason || 'Driver unassigned by admin',
      driverId: previousDriverId,
    });

    await booking.save();
    return this.mapToDetail(booking);
  }

  /**
   * Update booking details (admin)
   */
  async update(id: string, dto: AdminUpdateBookingDto): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    // Update allowed fields
    if (dto.passengerFirstName) booking.passengerFirstName = dto.passengerFirstName;
    if (dto.passengerLastName) booking.passengerLastName = dto.passengerLastName;
    if (dto.passengerPhone) booking.passengerPhone = dto.passengerPhone;
    if (dto.pickupAt) booking.pickupAt = new Date(dto.pickupAt);

    // Update origin if provided (using PlaceDto)
    if (dto.origin) {
      booking.originType = dto.origin.type;
      booking.originAirportCode = dto.origin.airportCode;
      booking.originTerminal = dto.origin.terminal;
      booking.originName = dto.origin.name || getPlaceDisplayName(dto.origin);
      booking.originAddress = dto.origin.address;
      booking.originLatitude = dto.origin.latitude;
      booking.originLongitude = dto.origin.longitude;
      if (dto.origin.regionId) {
        booking.originRegionId = new Types.ObjectId(dto.origin.regionId);
      }
    }

    // Update destination if provided (using PlaceDto)
    if (dto.destination) {
      booking.destinationType = dto.destination.type;
      booking.destinationAirportCode = dto.destination.airportCode;
      booking.destinationTerminal = dto.destination.terminal;
      booking.destinationName = dto.destination.name || getPlaceDisplayName(dto.destination);
      booking.destinationAddress = dto.destination.address;
      booking.destinationLatitude = dto.destination.latitude;
      booking.destinationLongitude = dto.destination.longitude;
      if (dto.destination.regionId) {
        booking.destinationRegionId = new Types.ObjectId(dto.destination.regionId);
      }
    }

    if (dto.passengers) booking.passengers = dto.passengers;
    if (dto.luggage !== undefined) booking.luggage = dto.luggage;
    if (dto.extras) booking.extras = dto.extras;

    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: 'booking_updated',
      status: booking.status,
      timestamp: new Date(),
      description: dto.adminNotes || 'Booking details updated by admin',
    });

    await booking.save();

    // Send booking update notification to driver (if assigned)
    if (booking.assignedDriver) {
      // Generate driver link for the notification
      let driverLink: string | undefined;
      try {
        const driverLinkData = this.driverAccessService.generateDriverAccessLink(
          booking.bookingId,
          booking.assignedDriver.toString(),
        );
        driverLink = driverLinkData.driverLink;
      } catch (err) {
        this.logger.warn(`Could not generate driver link for update notification`);
      }

      this.notificationService.onBookingUpdated(
        booking.bookingId,
        booking.assignedDriver.toString(),
        driverLink,
      ).catch((err) => {
        this.logger.error(`Failed to send booking update notification: ${err.message}`);
      });
    }

    return this.mapToDetail(booking);
  }

  /**
   * Cancel booking (admin)
   */
  async cancel(id: string, dto: AdminCancelBookingDto): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    // Validate booking can be cancelled
    const nonCancellableStatuses = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
      BookingStatus.ON_TRIP,
    ];
    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel booking with status ${booking.status}`);
    }

    // Update status
    booking.status = BookingStatus.CANCELLED_BY_OPS;
    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: BookingEventName.CANCELLED,
      status: BookingStatus.CANCELLED_BY_OPS,
      timestamp: new Date(),
      description: dto.reason,
      notes: dto.notes,
    });

    await booking.save();
    return this.mapToDetail(booking);
  }

  /**
   * Add event to booking
   */
  async addEvent(id: string, dto: AddBookingEventDto): Promise<BookingDetailResponseDto> {
    const booking = await this.findBookingById(id);

    booking.events.push({
      event: dto.event,
      status: booking.status,
      timestamp: new Date(),
      description: dto.description,
      location: dto.location,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    booking.updatedAt = new Date();
    await booking.save();
    return this.mapToDetail(booking);
  }

  /**
   * Get booking statistics
   */
  async getStats(fromDate?: string, toDate?: string): Promise<BookingStatsDto> {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }

    // Get counts by status
    const statusCounts = await this.bookingModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();

    // Get counts by vehicle class
    const vehicleClassCounts = await this.bookingModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$vehicleClass', count: { $sum: 1 } } },
    ]).exec();

    // Get revenue stats
    const revenueStats = await this.bookingModel.aggregate([
      { $match: { ...dateFilter, status: { $in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.ON_TRIP] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    // Get total count
    const totalBookings = await this.bookingModel.countDocuments(dateFilter).exec();

    // Map status counts
    const byStatus: Record<string, number> = {};
    statusCounts.forEach((item: any) => {
      byStatus[item._id] = item.count;
    });

    // Map vehicle class counts
    const byVehicleClass: Record<string, number> = {};
    vehicleClassCounts.forEach((item: any) => {
      if (item._id) byVehicleClass[item._id] = item.count;
    });

    // Calculate stats
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const completedCount = revenueStats[0]?.count || 0;
    const averageBookingValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Count by categories
    const pendingBookings = (byStatus[BookingStatus.PENDING_PAYMENT] || 0);
    const confirmedBookings = (byStatus[BookingStatus.CONFIRMED] || 0) + (byStatus[BookingStatus.DRIVER_ASSIGNED] || 0);
    const activeBookings = (byStatus[BookingStatus.EN_ROUTE] || 0) + 
                          (byStatus[BookingStatus.ARRIVED] || 0) + 
                          (byStatus[BookingStatus.WAITING] || 0) + 
                          (byStatus[BookingStatus.ON_TRIP] || 0);
    const completedBookings = byStatus[BookingStatus.COMPLETED] || 0;
    const cancelledBookings = (byStatus[BookingStatus.CANCELLED_BY_USER] || 0) + 
                              (byStatus[BookingStatus.CANCELLED_BY_OPS] || 0);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      currency: 'AED', // TODO: Get from config or booking data
      averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      byStatus,
      byVehicleClass,
    };
  }

  /**
   * Get bookings for a specific driver
   */
  async findByDriver(driverId: string, status?: BookingStatus): Promise<BookingListItemDto[]> {
    const filter: FilterQuery<SimpleBookingDocument> = {
      assignedDriver: new Types.ObjectId(driverId),
    };
    if (status) {
      filter.status = status;
    }

    const bookings = await this.bookingModel.find(filter).sort({ pickupAt: 1 }).exec();
    
    // Get driver name
    const driver = await this.driverModel.findById(driverId).select('firstName lastName').exec();
    const driverNameMap = new Map<string, string>();
    if (driver) {
      driverNameMap.set(driverId, `${driver.firstName} ${driver.lastName}`);
    }

    return bookings.map(booking => this.mapToListItemWithDriver(booking, driverNameMap));
  }

  /**
   * Get upcoming bookings
   */
  async findUpcoming(hours: number = 24): Promise<BookingListItemDto[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const bookings = await this.bookingModel.find({
      pickupAt: { $gte: now, $lte: future },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED] },
    }).sort({ pickupAt: 1 }).limit(50).exec();

    return this.addDriverNamesToBookings(bookings);
  }

  /**
   * Get bookings requiring attention (unassigned, overdue, etc.)
   */
  async findRequiringAttention(): Promise<BookingListItemDto[]> {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const bookings = await this.bookingModel.find({
      $or: [
        // Confirmed but no driver assigned and pickup is within 1 hour
        {
          status: BookingStatus.CONFIRMED,
          assignedDriver: { $exists: false },
          pickupAt: { $lte: oneHourFromNow, $gte: now },
        },
        // Driver declined
        {
          status: BookingStatus.DRIVER_DECLINED,
        },
        // Pending payment for too long (more than 1 hour)
        {
          status: BookingStatus.PENDING_PAYMENT,
          createdAt: { $lte: new Date(now.getTime() - 60 * 60 * 1000) },
        },
      ],
    }).sort({ pickupAt: 1 }).limit(50).exec();

    return this.addDriverNamesToBookings(bookings);
  }

  /**
   * Helper: Add driver names to a list of bookings
   */
  private async addDriverNamesToBookings(bookings: SimpleBookingDocument[]): Promise<BookingListItemDto[]> {
    const driverIds = bookings
      .filter(b => b.assignedDriver)
      .map(b => b.assignedDriver!);

    const driverNameMap = new Map<string, string>();
    if (driverIds.length > 0) {
      const drivers = await this.driverModel.find({ _id: { $in: driverIds } }).select('firstName lastName').exec();
      drivers.forEach(driver => {
        driverNameMap.set(driver._id.toString(), `${driver.firstName} ${driver.lastName}`);
      });
    }

    return bookings.map(booking => this.mapToListItemWithDriver(booking, driverNameMap));
  }

  /**
   * Get or regenerate driver access link for a booking (never expires)
   */
  async getDriverLink(id: string): Promise<{
    driverLink: string;
    token: string;
    bookingId: string;
    driverId: string;
  }> {
    const booking = await this.findBookingById(id);
    
    if (!booking.assignedDriver) {
      throw new BadRequestException('No driver assigned to this booking');
    }

    const driverLinkData = this.driverAccessService.generateDriverAccessLink(
      booking.bookingId,
      booking.assignedDriver.toString(),
    );

    return {
      driverLink: driverLinkData.driverLink,
      token: driverLinkData.token,
      bookingId: booking.bookingId,
      driverId: booking.assignedDriver.toString(),
    };
  }

  /**
   * Get customer booking page link for a booking
   */
  async getCustomerLink(id: string): Promise<{
    bookingId: string;
    accessCode: string;
    bookingUrl: string;
  }> {
    const booking = await this.findBookingById(id);
    
    // Generate access code if not already present
    if (!booking.accessCode) {
      booking.accessCode = await this.generateUniqueAccessCode();
      booking.updatedAt = new Date();
      await booking.save();
    }

    return {
      bookingId: booking.bookingId,
      accessCode: booking.accessCode,
      bookingUrl: `${this.frontendUrl}/my-booking/${booking.accessCode}`,
    };
  }

  // ============ Private Helper Methods ============

  private async findBookingById(id: string): Promise<SimpleBookingDocument> {
    let booking: SimpleBookingDocument | null = null;

    // Try to find by MongoDB ObjectId
    if (Types.ObjectId.isValid(id)) {
      booking = await this.bookingModel.findById(id).exec();
    }

    // If not found, try by bookingId
    if (!booking) {
      booking = await this.bookingModel.findOne({ bookingId: id }).exec();
    }

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING_PAYMENT]: [
        BookingStatus.CONFIRMED,
        BookingStatus.PAYMENT_FAILED,
        BookingStatus.CANCELLED_BY_USER,
        BookingStatus.CANCELLED_BY_OPS,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.DRIVER_ASSIGNED,
        BookingStatus.CANCELLED_BY_USER,
        BookingStatus.CANCELLED_BY_OPS,
      ],
      [BookingStatus.DRIVER_ASSIGNED]: [
        BookingStatus.CONFIRMED, // If driver unassigned
        BookingStatus.DRIVER_DECLINED,
        BookingStatus.EN_ROUTE,
        BookingStatus.CANCELLED_BY_USER,
        BookingStatus.CANCELLED_BY_OPS,
      ],
      [BookingStatus.DRIVER_DECLINED]: [
        BookingStatus.CONFIRMED,
        BookingStatus.DRIVER_ASSIGNED,
        BookingStatus.CANCELLED_BY_OPS,
      ],
      [BookingStatus.EN_ROUTE]: [
        BookingStatus.ARRIVED,
        BookingStatus.CANCELLED_BY_OPS,
      ],
      [BookingStatus.ARRIVED]: [
        BookingStatus.WAITING,
        BookingStatus.ON_TRIP,
        BookingStatus.NO_SHOW,
      ],
      [BookingStatus.WAITING]: [
        BookingStatus.ON_TRIP,
        BookingStatus.NO_SHOW,
      ],
      [BookingStatus.NO_SHOW]: [
        BookingStatus.COMPLETED, // Billing completed
      ],
      [BookingStatus.ON_TRIP]: [
        BookingStatus.COMPLETED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED_BY_USER]: [],
      [BookingStatus.CANCELLED_BY_OPS]: [],
      [BookingStatus.PAYMENT_FAILED]: [
        BookingStatus.PENDING_PAYMENT, // Retry
        BookingStatus.CANCELLED_BY_OPS,
      ],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private mapToListItem = (booking: SimpleBookingDocument): BookingListItemDto => {
    return {
      _id: booking._id.toString(),
      bookingId: booking.bookingId,
      accessCode: booking.accessCode,
      status: booking.status,
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerPhone: booking.passengerPhone,
      originName: booking.originName || booking.originAddress || 'N/A',
      destinationName: booking.destinationName || booking.destinationAddress || 'N/A',
      pickupAt: booking.pickupAt,
      flightNumber: booking.flightNumber,
      flightDate: booking.flightDate,
      vehicleId: booking.vehicleId?.toString(),
      vehicleClass: booking.vehicleClass,
      total: booking.total,
      currency: booking.currency,
      driverName: undefined,
      createdAt: booking.createdAt,
    };
  };

  private mapToListItemWithDriver = (
    booking: SimpleBookingDocument,
    driverNameMap: Map<string, string>,
  ): BookingListItemDto => {
    const item = this.mapToListItem(booking);
    
    // Get actual driver name from map
    if (booking.assignedDriver) {
      item.driverName = driverNameMap.get(booking.assignedDriver.toString()) || 'Unknown Driver';
    }
    
    return item;
  };

  private mapToDetail = (booking: SimpleBookingDocument, includeDriverLink: boolean = true): BookingDetailResponseDto => {
    // Build origin PlaceResponseDto
    const origin: PlaceResponseDto = {
      type: (booking.originType as PlaceType) || PlaceType.ADDRESS,
      airportCode: booking.originAirportCode,
      terminal: booking.originTerminal,
      name: booking.originName || 'N/A',
      address: booking.originAddress,
      latitude: booking.originLatitude,
      longitude: booking.originLongitude,
      regionId: booking.originRegionId?.toString(),
    };

    // Build destination PlaceResponseDto
    const destination: PlaceResponseDto = {
      type: (booking.destinationType as PlaceType) || PlaceType.ADDRESS,
      airportCode: booking.destinationAirportCode,
      terminal: booking.destinationTerminal,
      name: booking.destinationName || 'N/A',
      address: booking.destinationAddress,
      latitude: booking.destinationLatitude,
      longitude: booking.destinationLongitude,
      regionId: booking.destinationRegionId?.toString(),
    };

    // Generate driver link if driver is assigned and link is requested (never expires)
    let driverLink: string | undefined;
    let driverAccessToken: string | undefined;
    
    if (includeDriverLink && booking.assignedDriver) {
      try {
        const driverLinkData = this.driverAccessService.generateDriverAccessLink(
          booking.bookingId,
          booking.assignedDriver.toString(),
        );
        driverLink = driverLinkData.driverLink;
        driverAccessToken = driverLinkData.token;
      } catch (error) {
        // Log but don't fail if driver link generation fails
        this.logger.warn(`Failed to generate driver link for booking ${booking.bookingId}: ${error}`);
      }
    }

    // Generate customer booking URL
    const bookingUrl = booking.accessCode 
      ? `${this.frontendUrl}/my-booking/${booking.accessCode}`
      : undefined;

    return {
      _id: booking._id.toString(),
      bookingId: booking.bookingId,
      accessCode: booking.accessCode,
      status: booking.status,
      userId: booking.userId?.toString() || null,  // null for guest bookings
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerFirstName: booking.passengerFirstName,
      passengerLastName: booking.passengerLastName,
      passengerPhone: booking.passengerPhone,
      originName: booking.originName || 'N/A',
      destinationName: booking.destinationName || 'N/A',
      origin,
      destination,
      pickupAt: booking.pickupAt,
      flightNumber: booking.flightNumber,
      flightDate: booking.flightDate,
      actualPickupAt: booking.actualPickupAt,
      actualDropoffAt: booking.actualDropoffAt,
      passengers: booking.passengers,
      luggage: booking.luggage,
      extras: booking.extras,
      vehicleId: booking.vehicleId?.toString(),
      vehicleClass: booking.vehicleClass,
      vehicleName: booking.vehicleName,
      vehicleCapacity: booking.vehicleCapacity,
      vehicleBagCapacity: booking.vehicleBagCapacity,
      baseFare: booking.baseFare,
      distanceCharge: booking.distanceCharge,
      timeCharge: booking.timeCharge,
      airportFees: booking.airportFees,
      surcharges: booking.surcharges,
      extrasTotal: booking.extrasTotal,
      total: booking.total,
      currency: booking.currency,
      assignedDriver: booking.assignedDriver?.toString(),
      driverLink,
      driverAccessToken,
      bookingUrl,
      events: booking.events || [],
      paymentConfirmedAt: booking.paymentConfirmedAt,
      paymentIntentId: booking.paymentIntentId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  };
}

