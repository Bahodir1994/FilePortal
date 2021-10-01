import django_filters
from django.forms import DateInput
from django import forms
from .models import *
from django.contrib.auth.models import User


class ThemesFilter(django_filters.FilterSet):
    theme = django_filters.CharFilter(lookup_expr='icontains')
    class Meta:
        model = Themes
        fields = ['subject_type', 'responsible_section', 'theme', 'lesson_date']
        widgets = {
            'lesson_date': DateInput(format=('%d/%m/%Y'), attrs={'paceholder': 'Select a date', 'type': 'date'}),

        }

class Sections_and_groups_Filter(django_filters.FilterSet):
    class Meta:
        model = Themes
        fields = ['subject_type', 'responsible_section', 'theme', 'lesson_date']


class UserFilter(django_filters.FilterSet):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'last_login']
