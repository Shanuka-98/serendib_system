"""
Fix Password Hashes Script
Run this script after importing schema.sql to fix all password hashes.

This script will update all user passwords with correct bcrypt hashes.
Default passwords:
- Admin: admin123
- Staff (demo): Test@1234 (staff@serendibhotels.lk)
- Staff (others): staff123
- Guest: guest123
"""

import sys
import os

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db, bcrypt
from app.models.user import User

def fix_passwords():
    """Fix all password hashes in the database"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Fixing Password Hashes")
        print("=" * 60)
        
        # Get all users
        users = User.query.all()
        
        if not users:
            print("❌ No users found in database. Please import schema.sql first.")
            return
        
        print(f"\n📋 Found {len(users)} users to update\n")
        
        # Password mapping based on role
        password_map = {
            'admin': 'admin123',
            'staff': 'staff123',
            'guest': 'guest123'
        }
        
        # Special password for demo staff user
        demo_staff_email = 'staff@serendibhotels.lk'
        demo_staff_password = 'Test@1234'
        
        updated_count = 0
        error_count = 0
        
        for user in users:
            try:
                # Check if this is the demo staff user
                if user.email == demo_staff_email:
                    password = demo_staff_password
                else:
                    # Get password based on role
                    password = password_map.get(user.role, 'guest123')
                
                # Generate new password hash
                new_hash = bcrypt.generate_password_hash(password).decode('utf-8')
                
                # Update password
                user.password_hash = new_hash
                
                # Verify the password works
                if user.check_password(password):
                    updated_count += 1
                    print(f"✅ {user.role.upper():6} | {user.email:40} | Password: {password}")
                else:
                    error_count += 1
                    print(f"❌ {user.role.upper():6} | {user.email:40} | Failed to verify")
                    
            except Exception as e:
                error_count += 1
                print(f"❌ {user.role.upper():6} | {user.email:40} | Error: {str(e)}")
        
        # Commit all changes
        try:
            db.session.commit()
            print("\n" + "=" * 60)
            print(f"✅ Successfully updated {updated_count} passwords")
            if error_count > 0:
                print(f"⚠️  {error_count} errors occurred")
            print("=" * 60)
            print("\n📝 Test Credentials:")
            print("   Admin: admin@serendibhotels.lk / admin123")
            print("   Staff: staff@serendibhotels.lk / Test@1234")
            print("   Guest: john.doe@example.com / guest123")
            print("\n")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error committing changes: {str(e)}")
            return False
        
        return True

if __name__ == '__main__':
    try:
        success = fix_passwords()
        if success:
            print("✅ Password fix completed successfully!")
            sys.exit(0)
        else:
            print("❌ Password fix failed!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

