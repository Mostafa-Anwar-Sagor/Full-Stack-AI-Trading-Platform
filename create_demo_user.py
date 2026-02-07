import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_platform.settings')
django.setup()

from django.contrib.auth.models import User

# Create demo user
user, created = User.objects.get_or_create(
    username='demo',
    defaults={
        'email': 'demo@aitrading.com',
        'first_name': 'Demo',
        'last_name': 'Trader',
        'is_active': True
    }
)
user.set_password('Trading@123')
user.save()

if created:
    print("✅ Demo user created successfully!")
else:
    print("✅ Demo user already exists, password updated!")

print("\n" + "="*50)
print("🔐 Demo Login Credentials:")
print("="*50)
print("Username: demo")
print("Password: Trading@123")
print("="*50)
