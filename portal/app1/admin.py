from django.contrib import admin
# Register your models here.
from .models import Subjects, Sections_and_groups, Themes, UserThemeStatus


@admin.register(Subjects)
class Table_Subjects(admin.ModelAdmin):
    list_display = ['id', 'subject_name']

@admin.register(Sections_and_groups)
class Table_Sections_and_groups(admin.ModelAdmin):
    list_display = ['id', 'section_group']

@admin.register(Themes)
class Table_Themes(admin.ModelAdmin):
    list_display = ['id', 'theme', 'url', 'subject_type', 'responsible_section', 'lesson_date', 'doc_file',
                    'text', 'powerpoint_file', 'video_file', 'audio_file', 'img_file']

@admin.register(UserThemeStatus)
class Table_Sections_and_groups(admin.ModelAdmin):
    list_display = ['user_name_id', 'edited_theme_name', 'audio_file', 'test_results']


