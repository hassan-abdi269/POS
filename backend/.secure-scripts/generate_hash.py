# generate_hash.py
import bcrypt
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def generate_hash():
    """Generate a bcrypt hash for a password"""
    print("=" * 60)
    print("🔐 PASSWORD HASH GENERATOR")
    print("=" * 60)
    
    password = input("\nEnter password to hash: ")
    
    if len(password) < 6:
        print("\n❌ Password must be at least 6 characters long!")
        return None
    
    confirm = input("Confirm password: ")
    
    if password != confirm:
        print("\n❌ Passwords do not match!")
        return None
    
    # Generate hash with bcrypt
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
    hash_string = hashed.decode('utf-8')
    
    print("\n" + "=" * 60)
    print("✅ PASSWORD HASH GENERATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\n📝 Hash:\n{hash_string}")
    print("\n" + "=" * 60)
    print("\n📌 Add this to your .env file:")
    print(f'ADMIN_PASSWORD_HASH="{hash_string}"')
    print("\n⚠️  Remove the plain text ADMIN_PASSWORD from .env")
    print("💡 This is more secure!")
    print("=" * 60)
    
    # Test verification
    test = bcrypt.checkpw(password.encode('utf-8'), hashed)
    print(f"\n🔍 Verification Test: {'✅ PASSED' if test else '❌ FAILED'}")
    
    return hash_string


def test_existing_hash():
    """Test an existing hash with a password"""
    print("\n" + "=" * 60)
    print("🔍 TEST EXISTING HASH")
    print("=" * 60)
    
    hash_input = input("\nEnter the hash: ").strip()
    password = input("Enter the password to test: ")
    
    try:
        result = bcrypt.checkpw(password.encode('utf-8'), hash_input.encode('utf-8'))
        print(f"\n{'✅' if result else '❌'} Verification: {'PASSED' if result else 'FAILED'}")
        return result
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def check_env_status():
    """Check current .env configuration"""
    print("\n" + "=" * 60)
    print("📋 CURRENT .ENV STATUS")
    print("=" * 60)
    
    has_hash = bool(os.getenv('ADMIN_PASSWORD_HASH'))
    has_plain = bool(os.getenv('ADMIN_PASSWORD'))
    
    print(f"\nADMIN_PASSWORD_HASH: {'✅ Present' if has_hash else '❌ Not set'}")
    print(f"ADMIN_PASSWORD: {'✅ Present' if has_plain else '❌ Not set'}")
    
    if has_hash:
        hash_value = os.getenv('ADMIN_PASSWORD_HASH')
        print(f"  Hash: {hash_value[:30]}...")
    
    print("\n💡 Recommendations:")
    if has_hash and has_plain:
        print("  - Remove ADMIN_PASSWORD (only use hash)")
    elif has_hash:
        print("  ✅ Good! Only using hashed password")
    elif has_plain:
        print("  ⚠️ Only using plain text - generate a hash!")
    else:
        print("  ❌ No password configured!")


if __name__ == "__main__":
    print("\n🔐 PASSWORD MANAGEMENT TOOL")
    print("=" * 60)
    print("\n1. Generate new password hash")
    print("2. Test existing hash")
    print("3. Check .env status")
    print("4. Generate hash and update .env automatically")
    
    choice = input("\nSelect option (1-4): ").strip()
    
    if choice == "1":
        generate_hash()
    elif choice == "2":
        test_existing_hash()
    elif choice == "3":
        check_env_status()
    elif choice == "4":
        hash_result = generate_hash()
        if hash_result:
            # Ask to update .env
            update = input("\nUpdate .env file automatically? (y/n): ").strip().lower()
            if update == 'y':
                env_file = '.env'
                if os.path.exists(env_file):
                    with open(env_file, 'r') as f:
                        lines = f.readlines()
                    
                    # Update or add ADMIN_PASSWORD_HASH
                    updated = False
                    new_lines = []
                    for line in lines:
                        if line.startswith('ADMIN_PASSWORD_HASH='):
                            new_lines.append(f'ADMIN_PASSWORD_HASH="{hash_result}"\n')
                            updated = True
                        elif line.startswith('ADMIN_PASSWORD='):
                            # Comment out the plain password
                            new_lines.append(f'# ADMIN_PASSWORD=removed-for-security\n')
                        else:
                            new_lines.append(line)
                    
                    if not updated:
                        new_lines.append(f'\n# Admin credentials - using hashed password\n')
                        new_lines.append(f'ADMIN_PASSWORD_HASH="{hash_result}"\n')
                        # Comment out plain password if exists
                        if any(line.startswith('ADMIN_PASSWORD=') for line in lines):
                            new_lines.append('# ADMIN_PASSWORD=removed-for-security\n')
                    
                    with open(env_file, 'w') as f:
                        f.writelines(new_lines)
                    
                    print("\n✅ .env file updated successfully!")
                    print("🔐 Your password is now securely stored as a hash!")
                else:
                    print("\n❌ .env file not found!")
    else:
        print("Invalid option")
        sys.exit(1)