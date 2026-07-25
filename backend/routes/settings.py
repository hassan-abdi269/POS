# routes/settings.py
from flask import request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models.settings import Setting, NotificationPreference, UserSecurity
from datetime import datetime

def get_current_shop_id():
    """Get the current shop ID from the logged-in user"""
    if hasattr(current_user, 'id'):
        return current_user.id
    return None

def init_settings_routes(app):
    
    # ============ SETTINGS ROUTES ============
    
    @app.route('/api/settings', methods=['GET'])
    @login_required
    def get_settings():
        """Get all settings for the current shop only"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            category = request.args.get('category')
            
            query = Setting.query.filter_by(shop_id=shop_id)
            if category:
                query = query.filter_by(category=category)
            
            settings = query.all()
            return jsonify([s.to_dict() for s in settings])
            
        except Exception as e:
            print(f"Error fetching settings: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/settings/<string:key>', methods=['GET'])
    @login_required
    def get_setting(key):
        """Get a specific setting for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            setting = Setting.query.filter_by(key=key, shop_id=shop_id).first()
            if not setting:
                return jsonify({'error': 'Setting not found'}), 404
            
            return jsonify(setting.to_dict())
            
        except Exception as e:
            print(f"Error fetching setting: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/settings', methods=['POST'])
    @login_required
    def create_or_update_setting():
        """Create or update a setting for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            if not data or 'key' not in data:
                return jsonify({'error': 'Key is required'}), 400
            
            setting = Setting.query.filter_by(key=data['key'], shop_id=shop_id).first()
            
            if setting:
                # Update existing
                setting.value = data.get('value', '')
                setting.category = data.get('category', 'general')
                setting.updated_at = datetime.utcnow()
            else:
                # Create new
                setting = Setting(
                    shop_id=shop_id,
                    key=data['key'],
                    value=data.get('value', ''),
                    category=data.get('category', 'general'),
                    is_public=data.get('is_public', False)
                )
                db.session.add(setting)
            
            db.session.commit()
            return jsonify(setting.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error saving setting: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/settings/batch', methods=['POST'])
    @login_required
    def batch_update_settings():
        """Update multiple settings at once for the current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            if not data or 'settings' not in data:
                return jsonify({'error': 'Settings array is required'}), 400
            
            updated = []
            for setting_data in data['settings']:
                setting = Setting.query.filter_by(key=setting_data['key'], shop_id=shop_id).first()
                
                if setting:
                    setting.value = setting_data.get('value', '')
                    setting.category = setting_data.get('category', 'general')
                    setting.updated_at = datetime.utcnow()
                else:
                    setting = Setting(
                        shop_id=shop_id,
                        key=setting_data['key'],
                        value=setting_data.get('value', ''),
                        category=setting_data.get('category', 'general'),
                        is_public=setting_data.get('is_public', False)
                    )
                    db.session.add(setting)
                
                updated.append(setting.to_dict())
            
            db.session.commit()
            return jsonify({
                'message': f'Updated {len(updated)} settings',
                'settings': updated
            }), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error batch updating settings: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ NOTIFICATION PREFERENCES ============
    
    @app.route('/api/notifications/preferences', methods=['GET'])
    @login_required
    def get_notification_preferences():
        """Get notification preferences for current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            preferences = NotificationPreference.query.filter_by(
                shop_id=shop_id
            ).all()
            
            # If no preferences, create defaults
            if not preferences:
                default_prefs = [
                    {'notification_type': 'email', 'enabled': True},
                    {'notification_type': 'push', 'enabled': True},
                    {'notification_type': 'sms', 'enabled': False},
                    {'notification_type': 'marketing', 'enabled': False}
                ]
                
                for pref in default_prefs:
                    new_pref = NotificationPreference(
                        shop_id=shop_id,
                        notification_type=pref['notification_type'],
                        enabled=pref['enabled']
                    )
                    db.session.add(new_pref)
                
                db.session.commit()
                preferences = NotificationPreference.query.filter_by(
                    shop_id=shop_id
                ).all()
            
            return jsonify([{
                'type': p.notification_type,
                'enabled': p.enabled
            } for p in preferences])
            
        except Exception as e:
            print(f"Error fetching notification preferences: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/notifications/preferences', methods=['POST'])
    @login_required
    def update_notification_preferences():
        """Update notification preferences for current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            if not data or 'preferences' not in data:
                return jsonify({'error': 'Preferences array is required'}), 400
            
            for pref_data in data['preferences']:
                preference = NotificationPreference.query.filter_by(
                    shop_id=shop_id,
                    notification_type=pref_data['type']
                ).first()
                
                if preference:
                    preference.enabled = pref_data.get('enabled', False)
                    preference.updated_at = datetime.utcnow()
            
            db.session.commit()
            return jsonify({'message': 'Preferences updated successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating notification preferences: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ SECURITY SETTINGS ============
    
    @app.route('/api/security/settings', methods=['GET'])
    @login_required
    def get_security_settings():
        """Get security settings for current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            security = UserSecurity.query.filter_by(
                shop_id=shop_id
            ).first()
            
            if not security:
                security = UserSecurity(
                    shop_id=shop_id,
                    two_factor_auth=False,
                    session_timeout=30
                )
                db.session.add(security)
                db.session.commit()
            
            return jsonify({
                'two_factor_auth': security.two_factor_auth,
                'session_timeout': security.session_timeout
            }), 200
            
        except Exception as e:
            print(f"Error fetching security settings: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/security/settings', methods=['POST'])
    @login_required
    def update_security_settings():
        """Update security settings for current shop"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            security = UserSecurity.query.filter_by(
                shop_id=shop_id
            ).first()
            
            if not security:
                security = UserSecurity(
                    shop_id=shop_id
                )
                db.session.add(security)
            
            if 'two_factor_auth' in data:
                security.two_factor_auth = data['two_factor_auth']
            
            if 'session_timeout' in data:
                security.session_timeout = int(data['session_timeout'])
            
            security.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Security settings updated successfully',
                'settings': {
                    'two_factor_auth': security.two_factor_auth,
                    'session_timeout': security.session_timeout
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating security settings: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ============ CHANGE PASSWORD ============
    
    @app.route('/api/security/change-password', methods=['POST'])
    @login_required
    def change_password():
        """Change shop password"""
        try:
            shop_id = get_current_shop_id()
            if not shop_id:
                return jsonify({'error': 'Shop not found'}), 401
            
            data = request.get_json()
            
            if not data or 'current_password' not in data or 'new_password' not in data:
                return jsonify({'error': 'Current password and new password are required'}), 400
            
            # Get the shop from the Shop model
            from models.shop import Shop
            shop = Shop.query.get(shop_id)
            
            if not shop:
                return jsonify({'error': 'Shop not found'}), 404
            
            # Verify current password
            if not shop.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            # Set new password
            shop.set_password(data['new_password'])
            db.session.commit()
            
            return jsonify({'message': 'Password changed successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error changing password: {e}")
            return jsonify({'error': str(e)}), 500