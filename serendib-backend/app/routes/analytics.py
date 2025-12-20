"""
Analytics Routes
Revenue analytics, occupancy rates, booking trends, customer insights
"""

from flask import Blueprint, request, make_response
from flask_jwt_extended import jwt_required
from sqlalchemy import func, and_, extract, case
from datetime import datetime, timedelta
from app import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.room import Room
from app.models.user import User
from app.models.branch import Branch
from app.middleware.auth import staff_or_admin_required, get_current_user
from app.utils.helpers import success_response, error_response

analytics_bp = Blueprint('analytics', __name__)




@analytics_bp.route('/revenue', methods=['GET'])
@jwt_required()
@staff_or_admin_required
def get_revenue_analytics():
    """
    Get revenue analytics
    
    Query Parameters:
        branch_id: Filter by branch
        period: Time period (week, month, quarter, year)
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
    """
    current_user = get_current_user()
    branch_id = request.args.get('branch_id', type=int)
    period = request.args.get('period', 'month')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Staff can only view their branch analytics
    if current_user.role == 'staff':
        branch_id = current_user.branch_id
    
    # Parse dates
    try:
        if date_from and date_to:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
        else:
            # Default periods
            date_to_obj = datetime.now().date()
            if period == 'week':
                date_from_obj = date_to_obj - timedelta(days=7)
            elif period == 'quarter':
                date_from_obj = date_to_obj - timedelta(days=90)
            elif period == 'year':
                date_from_obj = date_to_obj - timedelta(days=365)
            else:  # month
                date_from_obj = date_to_obj - timedelta(days=30)
    except ValueError:
        return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
    
    # Revenue by date
    query = db.session.query(
        func.date(Payment.payment_date).label('date'),
        func.sum(Payment.amount).label('revenue'),
        func.count(Payment.payment_id).label('transactions'),
        func.avg(Payment.amount).label('avg_transaction')
    ).filter(
        and_(
            Payment.payment_status == 'completed',
            Payment.payment_date >= date_from_obj,
            Payment.payment_date <= date_to_obj
        )
    )
    
    if branch_id:
        query = query.join(Booking, Payment.booking_id == Booking.booking_id).filter(Booking.branch_id == branch_id)
    
    results = query.group_by(func.date(Payment.payment_date)).all()
    
    daily_revenue = [{
        'date': str(r.date),
        'revenue': float(r.revenue),
        'transactions': r.transactions,
        'avg_transaction': float(r.avg_transaction)
    } for r in results]
    
    # Total statistics
    total_revenue = sum(r['revenue'] for r in daily_revenue)
    total_transactions = sum(r['transactions'] for r in daily_revenue)
    avg_daily_revenue = total_revenue / len(daily_revenue) if daily_revenue else 0
    
    # Revenue by branch
    branch_query = db.session.query(
        Branch.name,
        func.sum(Payment.amount).label('revenue'),
        func.count(Payment.payment_id).label('transactions')
    ).select_from(Payment).join(
        Booking, Payment.booking_id == Booking.booking_id
    ).join(
        Branch, Booking.branch_id == Branch.branch_id
    ).filter(
        and_(
            Payment.payment_status == 'completed',
            Payment.payment_date >= date_from_obj,
            Payment.payment_date <= date_to_obj
        )
    )
    
    if branch_id:
        branch_query = branch_query.filter(Branch.branch_id == branch_id)
    
    branch_results = branch_query.group_by(Branch.name).all()
    
    revenue_by_branch = [{
        'branch': r.name,
        'revenue': float(r.revenue),
        'transactions': r.transactions
    } for r in branch_results]
    
    # Payment method breakdown
    method_query = db.session.query(
        Payment.payment_method,
        func.sum(Payment.amount).label('revenue'),
        func.count(Payment.payment_id).label('count')
    ).filter(
        and_(
            Payment.payment_status == 'completed',
            Payment.payment_date >= date_from_obj,
            Payment.payment_date <= date_to_obj
        )
    )
    
    if branch_id:
        method_query = method_query.join(Booking, Payment.booking_id == Booking.booking_id).filter(Booking.branch_id == branch_id)
    
    method_results = method_query.group_by(Payment.payment_method).all()
    
    payment_methods = [{
        'method': r.payment_method,
        'revenue': float(r.revenue),
        'count': r.count
    } for r in method_results]
    
    return success_response(data={
        'period': {
            'from': str(date_from_obj),
            'to': str(date_to_obj)
        },
        'summary': {
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
            'avg_daily_revenue': avg_daily_revenue,
            'avg_transaction_value': total_revenue / total_transactions if total_transactions > 0 else 0
        },
        'daily_revenue': daily_revenue,
        'revenue_by_branch': revenue_by_branch,
        'payment_methods': payment_methods
    })


@analytics_bp.route('/occupancy', methods=['GET'])
@jwt_required()
@staff_or_admin_required
def get_occupancy_analytics():
    """
    Get occupancy rate analytics
    
    Query Parameters:
        branch_id: Filter by branch
        date_from: Start date
        date_to: End date
    """
    current_user = get_current_user()
    branch_id = request.args.get('branch_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Staff can only view their branch
    if current_user.role == 'staff':
        branch_id = current_user.branch_id
    
    # Parse dates
    try:
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date() if date_from else (datetime.now() - timedelta(days=30)).date()
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date() if date_to else datetime.now().date()
    except ValueError:
        return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
    
    # Current occupancy
    total_rooms_query = Room.query
    occupied_rooms_query = Room.query.filter_by(status='occupied')
    
    if branch_id:
        total_rooms_query = total_rooms_query.filter_by(branch_id=branch_id)
        occupied_rooms_query = occupied_rooms_query.filter_by(branch_id=branch_id)
    
    total_rooms = total_rooms_query.count()
    occupied_rooms = occupied_rooms_query.count()
    current_occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Historical occupancy by date
    query = db.session.query(
        func.date(Booking.check_in_date).label('date'),
        func.count(Booking.booking_id).label('bookings')
    ).filter(
        and_(
            Booking.check_in_date >= date_from_obj,
            Booking.check_in_date <= date_to_obj,
            Booking.status.in_(['confirmed', 'checked_in', 'checked_out'])
        )
    )
    
    if branch_id:
        query = query.filter(Booking.branch_id == branch_id)
    
    results = query.group_by(func.date(Booking.check_in_date)).all()
    
    daily_occupancy = [{
        'date': str(r.date),
        'bookings': r.bookings,
        'occupancy_rate': (r.bookings / total_rooms * 100) if total_rooms > 0 else 0
    } for r in results]
    
    # Occupancy by branch
    branch_occupancy = []
    for branch in Branch.query.all():
        if branch_id and branch.branch_id != branch_id:
            continue
        
        branch_total = Room.query.filter_by(branch_id=branch.branch_id).count()
        branch_occupied = Room.query.filter_by(branch_id=branch.branch_id, status='occupied').count()
        branch_available = Room.query.filter_by(branch_id=branch.branch_id, status='available').count()
        
        branch_occupancy.append({
            'branch_id': branch.branch_id,
            'branch_name': branch.name,
            'total_rooms': branch_total,
            'occupied': branch_occupied,
            'available': branch_available,
            'occupancy_rate': (branch_occupied / branch_total * 100) if branch_total > 0 else 0
        })
    
    # Room type occupancy
    room_type_stats = db.session.query(
        Room.room_type,
        func.count(Room.room_id).label('total'),
        func.sum(case((Room.status == 'occupied', 1), else_=0)).label('occupied')
    )
    
    if branch_id:
        room_type_stats = room_type_stats.filter(Room.branch_id == branch_id)
    
    room_type_results = room_type_stats.group_by(Room.room_type).all()
    
    room_type_occupancy = [{
        'room_type': r.room_type,
        'total': r.total,
        'occupied': r.occupied,
        'occupancy_rate': (r.occupied / r.total * 100) if r.total > 0 else 0
    } for r in room_type_results]
    
    return success_response(data={
        'current': {
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': total_rooms - occupied_rooms,
            'occupancy_rate': round(current_occupancy_rate, 2)
        },
        'daily_occupancy': daily_occupancy,
        'branch_occupancy': branch_occupancy,
        'room_type_occupancy': room_type_occupancy
    })


@analytics_bp.route('/booking-trends', methods=['GET'])
@jwt_required()
@staff_or_admin_required
def get_booking_trends():
    """
    Get booking trend analytics
    """
    current_user = get_current_user()
    branch_id = request.args.get('branch_id', type=int)
    period = request.args.get('period', 'month')  # month, quarter, year
    
    # Staff can only view their branch
    if current_user.role == 'staff':
        branch_id = current_user.branch_id
    
    # Date range
    date_to = datetime.now().date()
    if period == 'quarter':
        date_from = date_to - timedelta(days=90)
    elif period == 'year':
        date_from = date_to - timedelta(days=365)
    else:
        date_from = date_to - timedelta(days=30)
    
    # Bookings by status
    status_query = db.session.query(
        Booking.status,
        func.count(Booking.booking_id).label('count')
    ).filter(
        Booking.booking_date >= date_from
    )
    
    if branch_id:
        status_query = status_query.filter(Booking.branch_id == branch_id)
    
    status_results = status_query.group_by(Booking.status).all()
    
    bookings_by_status = {r.status: r.count for r in status_results}
    
    # Bookings by month
    monthly_query = db.session.query(
        extract('year', Booking.booking_date).label('year'),
        extract('month', Booking.booking_date).label('month'),
        func.count(Booking.booking_id).label('count'),
        func.sum(Booking.total_amount).label('revenue')
    ).filter(
        Booking.booking_date >= date_from
    )
    
    if branch_id:
        monthly_query = monthly_query.filter(Booking.branch_id == branch_id)
    
    monthly_results = monthly_query.group_by(
        extract('year', Booking.booking_date),
        extract('month', Booking.booking_date)
    ).all()
    
    monthly_bookings = [{
        'year': int(r.year),
        'month': int(r.month),
        'bookings': r.count,
        'revenue': float(r.revenue) if r.revenue else 0
    } for r in monthly_results]
    
    # Average booking value
    avg_booking_value = db.session.query(
        func.avg(Booking.total_amount)
    ).filter(
        Booking.booking_date >= date_from,
        Booking.status != 'cancelled'
    )
    
    if branch_id:
        avg_booking_value = avg_booking_value.filter(Booking.branch_id == branch_id)
    
    avg_value = avg_booking_value.scalar() or 0
    
    # Lead time analysis (days between booking and check-in)
    # Using DATEDIFF for MySQL (DATEDIFF(date1, date2) returns date1 - date2 in days)
    lead_time_query = db.session.query(
        func.avg(func.datediff(Booking.check_in_date, Booking.booking_date)).label('avg_lead_time')
    ).filter(
        Booking.booking_date >= date_from,
        Booking.status != 'cancelled'
    )
    
    if branch_id:
        lead_time_query = lead_time_query.filter(Booking.branch_id == branch_id)
    
    avg_lead_time = lead_time_query.scalar() or 0
    
    # Length of stay analysis
    # Using DATEDIFF for MySQL
    stay_length_query = db.session.query(
        func.avg(func.datediff(Booking.check_out_date, Booking.check_in_date)).label('avg_stay')
    ).filter(
        Booking.booking_date >= date_from,
        Booking.status != 'cancelled'
    )
    
    if branch_id:
        stay_length_query = stay_length_query.filter(Booking.branch_id == branch_id)
    
    avg_stay_length = stay_length_query.scalar() or 0
    
    return success_response(data={
        'period': period,
        'bookings_by_status': bookings_by_status,
        'monthly_trends': monthly_bookings,
        'insights': {
            'avg_booking_value': float(avg_value),
            'avg_lead_time_days': round(float(avg_lead_time), 1),
            'avg_stay_length_days': round(float(avg_stay_length), 1)
        }
    })


@analytics_bp.route('/customer-insights', methods=['GET'])
@jwt_required()
@staff_or_admin_required
def get_customer_insights():
    """
    Get customer behavior analytics
    """
    current_user = get_current_user()
    branch_id = request.args.get('branch_id', type=int)
    
    # Staff can only view their branch
    if current_user.role == 'staff':
        branch_id = current_user.branch_id
    
    # Top customers by bookings
    top_customers_query = db.session.query(
        User.user_id,
        User.full_name,
        User.email,
        func.count(Booking.booking_id).label('total_bookings'),
        func.sum(Booking.total_amount).label('total_spent')
    ).join(Booking).filter(
        User.role == 'guest',
        Booking.status != 'cancelled'
    )
    
    if branch_id:
        top_customers_query = top_customers_query.filter(Booking.branch_id == branch_id)
    
    top_customers = top_customers_query.group_by(
        User.user_id, User.full_name, User.email
    ).order_by(func.count(Booking.booking_id).desc()).limit(10).all()
    
    top_customers_data = [{
        'user_id': c.user_id,
        'name': c.full_name,
        'email': c.email,
        'total_bookings': c.total_bookings,
        'total_spent': float(c.total_spent) if c.total_spent else 0
    } for c in top_customers]
    
    # New vs returning customers
    total_guests = User.query.filter_by(role='guest').count()
    guests_with_bookings = db.session.query(func.count(func.distinct(Booking.user_id))).filter(
        Booking.status != 'cancelled'
    ).scalar()
    
    # Guest demographics (loyalty tiers)
    from app.models.loyalty_program import LoyaltyProgram
    loyalty_stats = LoyaltyProgram.get_tier_stats()
    
    return success_response(data={
        'top_customers': top_customers_data,
        'customer_stats': {
            'total_guests': total_guests,
            'active_guests': guests_with_bookings,
            'loyalty_distribution': loyalty_stats
        }
    })

