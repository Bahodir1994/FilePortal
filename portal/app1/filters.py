import django_filters

from .models import *
from django.contrib.auth.models import User

class ThemesFilter(django_filters.FilterSet):
    class Meta:
        model = Themes
        #responsible_section = User.objects.filter(Group='admin-type-1')
        fields = ['subject_type', 'responsible_section', 'theme', 'lesson_date']


class Sections_and_groups_Filter(django_filters.FilterSet):
    class Meta:
        model = Themes
        fields = ['subject_type', 'responsible_section', 'theme', 'lesson_date']

class UserFilter(django_filters.FilterSet):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'last_login']