import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { randomUUID } from 'crypto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from '../schemas/simple-booking.schema';
import {
  AdminCreateBookingDto,
  BookingQueryDto,
  UpdateBookingStatusDto,
  AssignDriverDto,
  AdminUpdateBookingDto,
  AdminCancelBookingDto,
  AddBookingEventDto,
  BookingListResponseDto,
  BookingDetailResponseDto,
  BookingStatsDto,
  BookingListItemDto,
} from '../dto/admin-booking.dto';
import { PlaceDto, PlaceResponseDto, PlaceType, getPlaceDisplayName } from '../../../common/dto/place.dto';

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
  ) {}

  /**
   * Create a new booking (admin)
   * Used for phone bookings, walk-in customers, or manual bookings
   */
  async create(dto: AdminCreateBookingDto, adminUserId: string): Promise<BookingDetailResponseDto> {
    this.logger.log(`Admin ${adminUserId} creating booking for ${dto.passengerFirstName} ${dto.passengerLastName}`);

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

    // Create booking with consistent PlaceDto structure
    const booking = new this.bookingModel({
      bookingId,
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
      passengers: dto.passengers,
      luggage: dto.luggage,
      extras: dto.extras || [],
      vehicleClass: dto.vehicleClass,
      vehicleName: dto.vehicleName || dto.vehicleClass,
      vehicleCapacity: dto.vehicleCapacity || 4,
      vehicleBagCapacity: dto.vehicleBagCapacity || 2,
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

    return {
      bookings: bookings.map(this.mapToListItem),
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

    // Add event
    booking.events.push({
      event: BookingEventName.DRIVER_ASSIGNED,
      status: BookingStatus.DRIVER_ASSIGNED,
      timestamp: new Date(),
      description: dto.notes || 'Driver assigned by admin',
      driverId: new Types.ObjectId(dto.driverId),
    });

    await booking.save();
    return this.mapToDetail(booking);
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
    return bookings.map(this.mapToListItem);
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

    return bookings.map(this.mapToListItem);
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

    return bookings.map(this.mapToListItem);
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
      status: booking.status,
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerPhone: booking.passengerPhone,
      originName: booking.originName || booking.originAddress || 'N/A',
      destinationName: booking.destinationName || booking.destinationAddress || 'N/A',
      pickupAt: booking.pickupAt,
      vehicleClass: booking.vehicleClass,
      total: booking.total,
      currency: booking.currency,
      driverName: booking.assignedDriver ? 'Assigned' : undefined, // TODO: Populate driver name
      createdAt: booking.createdAt,
    };
  };

  private mapToDetail = (booking: SimpleBookingDocument): BookingDetailResponseDto => {
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

    return {
      _id: booking._id.toString(),
      bookingId: booking.bookingId,
      status: booking.status,
      userId: booking.userId.toString(),
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerFirstName: booking.passengerFirstName,
      passengerLastName: booking.passengerLastName,
      passengerPhone: booking.passengerPhone,
      originName: booking.originName || 'N/A',
      destinationName: booking.destinationName || 'N/A',
      origin,
      destination,
      pickupAt: booking.pickupAt,
      actualPickupAt: booking.actualPickupAt,
      actualDropoffAt: booking.actualDropoffAt,
      passengers: booking.passengers,
      luggage: booking.luggage,
      extras: booking.extras,
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
      events: booking.events || [],
      paymentConfirmedAt: booking.paymentConfirmedAt,
      paymentIntentId: booking.paymentIntentId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  };
}

