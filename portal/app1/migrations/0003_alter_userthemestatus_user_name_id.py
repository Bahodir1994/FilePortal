# Generated by Django 3.2.6 on 2021-09-04 14:01

import app1.current_user
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('app1', '0002_alter_themes_powerpoint_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userthemestatus',
            name='user_name_id',
            field=models.ForeignKey(default=app1.current_user.get_current_user, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]