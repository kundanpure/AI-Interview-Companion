# backend/routes/payments.py

import razorpay
from flask import request, jsonify, Blueprint, current_app

from ..app import db
from ..models import User
from .auth import token_required # Import our decorator

# Create a Blueprint for payment routes
payments_bp = Blueprint('payments', __name__)

# Define our product. In a real app, you might fetch this from a database.
# Price is in the smallest currency unit (e.g., paise for INR). 199 INR = 19900 paise.
PRODUCT = {
    'price_in_paise': 19900,
    'currency': 'INR',
    'credits_to_add': 2
}

@payments_bp.route('/create-order', methods=['POST'])
@token_required
def create_order(current_user):
    """
    Creates a Razorpay order and returns the order details to the frontend.
    The frontend will use this to open the Razorpay checkout modal.
    """
    try:
        # Initialize Razorpay client
        client = razorpay.Client(
            auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
        )

        # Prepare order data
        order_data = {
            'amount': PRODUCT['price_in_paise'],
            'currency': PRODUCT['currency'],
            'receipt': f'receipt_for_{current_user.email}_{datetime.utcnow().timestamp()}',
            'notes': {
                'user_id': current_user.id,
                'product': '2_interview_credits'
            }
        }

        # Create the order
        order = client.order.create(data=order_data)

        return jsonify({
            'order_id': order['id'],
            'key_id': current_app.config['RAZORPAY_KEY_ID'],
            'amount': order['amount'],
            'currency': order['currency']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/verify-payment', methods=['POST'])
@token_required
def verify_payment(current_user):
    """
    Verifies the payment signature from Razorpay after a successful transaction.
    This is a crucial security step to confirm the payment is authentic.
    """
    data = request.get_json()
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({'error': 'Missing payment details'}), 400

    try:
        # Initialize Razorpay client
        client = razorpay.Client(
            auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
        )

        # Construct the parameters for signature verification
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        # Verify the signature - THIS IS THE MOST IMPORTANT STEP
        client.utility.verify_payment_signature(params_dict)

        # If verification is successful, update the user's account
        user_to_update = User.query.get(current_user.id)
        if user_to_update:
            user_to_update.paid_interviews_remaining += PRODUCT['credits_to_add']
            db.session.commit()
            return jsonify({
                'message': 'Payment successful! Interview credits added.',
                'paid_interviews_remaining': user_to_update.paid_interviews_remaining
            }), 200
        else:
            return jsonify({'error': 'User not found during payment verification'}), 404

    except razorpay.errors.SignatureVerificationError:
        # If signature verification fails
        return jsonify({'error': 'Payment verification failed. Invalid signature.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500