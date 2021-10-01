from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django import forms

from django.forms import NumberInput

from .filters import ThemesFilter
from .models import Subjects, Sections_and_groups, Themes, UserThemeStatus


class CreateUserForm(UserCreationForm):
    """Registratsiya formasini chiqarish uchun qilingan"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'password1', 'password2']
        widgets = {
            'first_name': forms.Textarea(attrs={'cols': 'auto', 'rows': 'auto'}),
            'last_name': forms.Textarea(attrs={'cols': 'auto', 'rows': 'auto'}),
            'username': forms.Textarea(attrs={'cols': 'auto', 'rows': 'auto'}),
            'password1': forms.PasswordInput(),
            'password2': forms.PasswordInput(),
        }


class Subjects_Form(forms.ModelForm):
    class Meta:
        model = Subjects
        fields = ['subject_name']


class Sections_and_groups_Form(forms.ModelForm):
    class Meta:
        model = Sections_and_groups
        fields = ['section_group']


class Themes_Form_for_admin_type_1(forms.Form, forms.ModelForm):
    theme = forms.CharField(widget=forms.Textarea)
    url = forms.CharField(widget=forms.Textarea(attrs={'cols': 'auto', 'rows': 'auto'}))
    lesson_date = forms.DateField(widget=NumberInput(attrs={'type': 'date'}))

    class Meta:
        model = Themes
        fields = ['theme', 'url', 'subject_type', 'responsible_section', 'lesson_date']

"""
class ThemeList1(ThemesFilter):
    #User.objects.filter(groups__name__in=['admin-type-2'])
    #filters.py fayldan import bo'lgan self:ThemesFilter, forma kiritsh uchun qilingan! 
    theme = forms.CharField(widget=forms.Textarea(attrs={'cols': 'auto', 'rows': 'auto'}))
    lesson_date = forms.DateField(widget=NumberInput(attrs={'type': 'date'}))
    responsible_section = forms.ChoiceField(choices=User.objects.filter(groups__name__in=['admin-type-2']))
    subject_type = forms.ChoiceField(choices=Subjects.objects.all())

    class Meta:
        model = Themes
        fields = ['theme', 'lesson_date', 'responsible_section', 'subject_type']



class Themes_Form_for_admin_type_1(forms.ModelForm, forms.Form):
    class Meta:
        model = Themes
        file_fields = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}))
        fields = ['theme', 'url', 'subject_type', 'responsible_section', 'lesson_date']
        widgets = {
            'theme': Textarea(attrs={'cols': 'auto', 'rows': 'auto'}),
            'url': Textarea(attrs={'cols': 'auto', 'rows': 'auto'}),
            #'subject_type': ChoiceField(attrs={'cols': 'auto', 'rows': 'auto'}),
            'lesson_date': DateInput(format=('%d/%m/%Y'),
                                     attrs={'class': 'form-control', 'paceholder': 'Select a date', 'type': 'date'}),
        }
"""


class Themes_Form_for_admin_type_2(forms.ModelForm):
    class Meta:
        model = Themes
        file_fields = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}))
        fields = ['doc_file', 'text', 'powerpoint_file', 'video_file', 'audio_file', 'img_file']


class UserThemeStatus_Form(forms.ModelForm):
    class Meta:
        model = UserThemeStatus
        fields = ['edited_theme_name', 'audio_file', 'test_results']
