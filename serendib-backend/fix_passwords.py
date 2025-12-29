"""
Fix Password Hashes Script
Run this script after importing schema.sql to fix all password hashes.

This script will update all user passwords to Test@123 (consistent for all users).
"""

import sys
import os

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db, bcrypt
from app.models.user import User

def fix_passwords():
    """Fix all password hashes in the database to Test@123"""
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
        
        # Use single password for all users
        password = 'Test@123'
        
        updated_count = 0
        error_count = 0
        
        for user in users:
            try:
                # Generate new password hash
                new_hash = bcrypt.generate_password_hash(password).decode('utf-8')
                
                # Update password
                user.password_hash = new_hash
                
                # Verify the password works
                if user.check_password(password):
                    updated_count += 1
                    role_type_str = f" ({user.role_type})" if user.role_type else ""
                    print(f"✅ {user.role.upper():6}{role_type_str:20} | {user.email:40}")
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
            print("\n📝 All accounts use password: Test@123")
            print("\n   Example logins:")
            print("   Admin:       admin@serendibhotels.lk")
            print("   Manager:     manager@serendibhotels.lk")
            print("   Front Desk:  frontdesk@serendibhotels.lk")
            print("   Housekeeping: housekeeping@serendibhotels.lk")
            print("   Guest:       john.doe@example.com")
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

