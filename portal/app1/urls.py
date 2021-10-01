from django.urls import path
from .import views
from django.conf import settings
from django.conf.urls.static import static



urlpatterns = [

    path("", views.Home, name='home'),
    path('userhome/', views.UserHomePage1, name='userhome'),
    path('register/', views.RegisterPage, name='register'),
    path('login/', views.LoginPage, name='login'),
    path('logout/', views.logoutuser, name='logout'),

    path('tablepage1/', views.TablePage1.as_view(), name='tablepage1'),
    path('themeforwhich/', views.ThemesForWhich.as_view(), name='themeforwhich'),
    #path("<slug:slug>/", views.ThemeAddList.as_view(), name='themeaddlist'),
    path('usert/', views.Table, name='usert'),
    path('subjectpage/', views.SubjectPage, name='subjectpage'),
    path('authuserpage/', views.AuthUserPage, name='authuserpage'),
    path('error/', views.ErrorPage, name='error'),
    path("<slug:slug>/", views.TablePage1Detail.as_view(), name='themelist'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

"""
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
"""