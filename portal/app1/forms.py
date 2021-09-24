from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django import forms

from .models import Subjects, Sections_and_groups, Themes, UserThemeStatus


class CreateUserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'password1', 'password2']

class Subjects_Form(forms.ModelForm):
    class Meta:
        model = Subjects
        fields = ['subject_name']

class Sections_and_groups_Form(forms.ModelForm):
    class Meta:
        model = Sections_and_groups
        fields = ['section_group']

class Themes_Form_for_admin_type_1(forms.ModelForm):
    class Meta:
        model = Themes
        file_fields = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}))
        fields = ['theme', 'url', 'subject_type', 'responsible_section', 'lesson_date']


class Themes_Form_for_admin_type_2(forms.ModelForm):
    class Meta:
        model = Themes
        file_fields = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}))
        fields = ['doc_file', 'text', 'powerpoint_file', 'video_file', 'audio_file', 'img_file']

class UserThemeStatus_Form(forms.ModelForm):
    class Meta:
        model = UserThemeStatus
        fields = ['edited_theme_name', 'audio_file', 'test_results']
