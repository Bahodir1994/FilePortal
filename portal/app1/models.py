from urllib import request

from django.contrib.auth.models import User, Group
from django.urls import reverse
from django.db import models



# Create your models here.

def get_product_url(obj, viewname):
    ct_model = obj.__class__._meta.model_name
    return reverse(viewname, kwargs={'ct_model': ct_model, 'slug': obj.slug})


class Subjects(models.Model):
    """Bojxona fanlari"""
    subject_name = models.CharField(max_length=50, verbose_name="Fanning nomi")

    class Meta:
        verbose_name = ("Fan nomi")
        verbose_name_plural = ("Fan nomlari")
        db_table = "subjects"

    def __str__(self):
        return self.subject_name


class Sections_and_groups(models.Model):
    """Bo'lim va guruxlar"""
    section_group = models.ForeignKey(Group, max_length=50, on_delete=models.CASCADE, verbose_name="Bo'lim yoki gurux nomi")

    class Meta:
        verbose_name = ("Bo'lim va gurux")
        verbose_name_plural = ("Bo'lim va guruxlar")
        db_table = "sectionsandgroups"

    def __str__(self):
        return self.section_group


class Themes(models.Model):
    """Fan mavzulari"""
    theme = models.CharField(max_length=500, verbose_name="Mavzu nomi")
    url = models.SlugField(max_length=200, unique=True)
    subject_type = models.ForeignKey(Subjects, verbose_name="Fan nomi", on_delete=models.CASCADE, )
    responsible_section = models.ForeignKey(User, on_delete=models.CASCADE,
                                            verbose_name="Bo'lim/Gurux")
    lesson_date = models.DateField(verbose_name="Mavzu sanasi")
    doc_file = models.FileField(upload_to='all_docs/', blank=True, null=True,
                                verbose_name="Faqat 'doc' va 'docx' xujjatlarni yuklang!")
    text = models.TextField(verbose_name="Text uchun", null=True, blank=True)
    powerpoint_file = models.FileField(upload_to='all_powerpoint/', null=True, blank=True, verbose_name="Slay uchun")
    video_file = models.FileField(upload_to='all_video/', null=True, blank=True, verbose_name="Video fayl uchun")
    audio_file = models.FileField(upload_to='all_audio/', null=True, blank=True, verbose_name="Audio fayl uchun")
    img_file = models.ImageField(upload_to='all_photo/', null=True, blank=True, verbose_name="Foto fayl uchun")

    class Meta:
        verbose_name = ('Mavzusi')
        verbose_name_plural = ('Mavzular')
        db_table = "themes"

    def get_absolute_url(self):
        return reverse('themelist', kwargs={"slug": self.url})


    #def get_add_url(self):
     #   return reverse('themeaddlist', kwargs={"slug2": self.url})

    def __str__(self):
        return self.theme

"""
class ThemesEdit(models.Model):
    theme_name = models.ForeignKey(Themes, verbose_name="Mavzu", on_delete=models.CASCADE,)
    doc_file = models.FileField(upload_to='all_docs/', blank=True,  null=True, verbose_name="Faqat 'doc' va 'docx' xujjatlarni yuklang!")
    text = models.TextField(verbose_name="Text uchun", null=True, blank=True )
    powerpoint_file = models.FileField(upload_to='all_powerpoint/', null=True, blank=True, verbose_name="Slay uchun")
    video_file = models.FileField(upload_to='all_video/', null=True, blank=True, verbose_name="Video fayl uchun")
    audio_file = models.FileField(upload_to='all_audio/', null=True, blank=True, verbose_name="Audio fayl uchun")
    img_file = models.ImageField(upload_to='all_photo/', null=True, blank=True, verbose_name="Foto fayl uchun")
"""
#-----------------------------------------------------------------------------------------------------------------------

class UserThemeStatus(models.Model):
    """Mavzuni o'zlashtirganlar"""
    user_name_id = models.ForeignKey(User, on_delete=models.CASCADE)
    edited_theme_name = models.ForeignKey(Themes, on_delete=models.CASCADE, verbose_name='Tanlangan mavzu nomi')
    audio_file = models.FileField(upload_to='all_user_records/', null=True, blank=True, verbose_name="Foydalanuvchi audio yozuvlari")
    date_educated = models.DateTimeField( auto_now_add=True, blank=True, verbose_name="Mavzu o'rganilgan sana")
    test_results = models.IntegerField(verbose_name='Test natijasi')


    class Meta:
        verbose_name = ("Mavzuni o'tgan")
        verbose_name_plural = ("Mavzuni o'tgan")
        db_table = "editers_theme"

