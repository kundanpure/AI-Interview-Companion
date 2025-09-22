import json
import hmac
import hashlib
from datetime import datetime
import razorpay
from flask import request, jsonify, Blueprint, current_app
from ..app import db
from ..models import User, Payment
from .auth import token_required

payments_bp = Blueprint('payments', __name__)

# Real product (align price & copy everywhere)
PRODUCT = {
    'price_in_paise': int(float(current_app.config.get('PRODUCT_PRICE_INR', '199')) * 100) if current_app else 19900,
    'currency': 'INR',
    'credits_to_add': int(current_app.config.get('PRODUCT_CREDITS', 2)) if current_app else 2
}

def _razor_client():
    return razorpay.Client(
        auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
    )

@payments_bp.route('/create-order', methods=['POST'])
@token_required
def create_order(current_user):
    try:
        client = _razor_client()

        amount = PRODUCT['price_in_paise']
        order_data = {
            'amount': amount,
            'currency': PRODUCT['currency'],
            'receipt': f'receipt_{current_user.id}_{int(datetime.utcnow().timestamp())}',
            'notes': {'user_id': current_user.id, 'product': 'interview_credits'}
        }
        order = client.order.create(data=order_data)

        # persist Payment row in 'created' state
        payment = Payment(
            user_id=current_user.id,
            razorpay_order_id=order['id'],
            amount=order['amount'],
            currency=order['currency'],
            status='created',
            signature_ok=None
        )
        db.session.add(payment)
        db.session.commit()

        return jsonify({
            'order_id': order['id'],
            'key_id': current_app.config['RAZORPAY_KEY_ID'],
            'amount': order['amount'],
            'currency': order['currency']
        }), 200

    except Exception as e:
        current_app.logger.exception("create_order failed")
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/verify-payment', methods=['POST'])
@token_required
def verify_payment(current_user):
    data = request.get_json() or {}
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({'error': 'Missing payment details'}), 400

    try:
        client = _razor_client()
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)

        payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
        if not payment:
            return jsonify({'error': 'Payment record not found'}), 404
        if payment.status == 'paid':
            # already granted
            return jsonify({'message': 'Payment already processed.'}), 200

        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = 'paid'
        payment.signature_ok = True
        db.session.commit()

        user_to_update = User.query.get(current_user.id)
        user_to_update.paid_interviews_remaining += PRODUCT['credits_to_add']
        db.session.commit()

        return jsonify({
            'message': 'Payment successful! Interview credits added.',
            'paid_interviews_remaining': user_to_update.paid_interviews_remaining
        }), 200

    except razorpay.errors.SignatureVerificationError:
        payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
        if payment:
            payment.status = 'failed'
            payment.signature_ok = False
            db.session.commit()
        return jsonify({'error': 'Payment verification failed. Invalid signature.'}), 400
    except Exception as e:
        current_app.logger.exception("verify_payment failed")
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/webhook', methods=['POST'])
def razorpay_webhook():
    """Idempotent crediting via webhook (use Razorpay dashboard to set secret)."""
    payload = request.data
    signature = request.headers.get('X-Razorpay-Signature')
    secret = current_app.config.get('RAZORPAY_WEBHOOK_SECRET')
    if not secret:
        return jsonify({'error': 'Webhook secret not configured'}), 400

    calc_sig = hmac.new(bytes(secret, 'utf-8'), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc_sig, signature or ''):
        return jsonify({'error': 'Invalid signature'}), 400

    event = request.get_json() or {}
    current_app.logger.info(f"Webhook event: {event.get('event')}")

    if event.get('event') == 'payment.captured':
        entity = event.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = entity.get('order_id')
        payment_id = entity.get('id')
        amount = entity.get('amount')

        payment = Payment.query.filter_by(razorpay_order_id=order_id).first()
        if not payment:
            return jsonify({'status': 'ignored'}), 200

        if payment.status != 'paid':
            payment.razorpay_payment_id = payment_id
            payment.status = 'paid'
            payment.signature_ok = True
            payment.raw_payload = json.dumps(event)
            db.session.commit()

            user = User.query.get(payment.user_id)
            user.paid_interviews_remaining += PRODUCT['credits_to_add']
            db.session.commit()

    return jsonify({'status': 'ok'}), 200
