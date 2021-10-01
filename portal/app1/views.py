from django import forms
from django.shortcuts import get_object_or_404
from django.views.generic import ListView, DetailView, UpdateView

from online_users.models import OnlineUserActivity


from .forms import CreateUserForm, Subjects_Form, Sections_and_groups_Form, UserThemeStatus_Form, \
    Themes_Form_for_admin_type_2, Themes_Form_for_admin_type_1
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, Group
from .models import Themes, Subjects, Sections_and_groups, UserThemeStatus
from .filters import UserFilter, ThemesFilter
from .decorators import *


# -----------------------------------------------------------------------------------------------------------------------

def RegisterPage(request):
    if request.user.is_authenticated:
        return redirect('home')
    else:
        form = CreateUserForm()
        if request.method == "POST":
            form = CreateUserForm(request.POST)
            if form.is_valid():
                form.save()
                user = form.cleaned_data.get('username')
                messages.success(request, 'Account was created for  ' + user)
                return redirect('login')

        context = {'form': form}
        return render(request, 'app1/register.html', context)


# -----------------------------------------------------------------------------------------------------------------------

def LoginPage(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.info(request, 'Username or password incorrect')
    context = {}
    return render(request, 'app1/login.html', context)


def logoutuser(request):
    logout(request)
    return redirect('login')


# -----------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
@allowed_users2(allowed_roles=['super-admin', 'admin-type-1'])
def Home(request):
    authusers = User.objects.all()
    allusers = User.objects.all()
    numberallusers = allusers.count()
    us = User.objects.filter(groups__name__in=['admin-type-2'])
    activeusers = OnlineUserActivity.get_user_activities()
    numberactiveusers = activeusers.count()
    nameactiveusers = OnlineUserActivity.objects.all()

    subjectname = Subjects.objects.all()
    subjectcount = subjectname.count()

    form2 = Themes_Form_for_admin_type_1()
    if request.method =='POST':
        form2 = Themes_Form_for_admin_type_1(request.POST)
        if form2.is_valid():
            form2.save()
            return redirect('home')
    context = {
        'subjectname': subjectname,
        'subjectcount': subjectcount,
        'authusers': authusers,
        'numberactiveusers': numberactiveusers,
        'activeusers': activeusers,
        'numberallusers': numberallusers,
        'nameactiveusers': nameactiveusers,
        'form2': form2,
        'us': us
    }

    return render(request, 'app1/home.html', context)

# -----------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
def UserHomePage1(request):
    context ={}
    return render(request, 'app1/userhome.html', context)


# -----------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
@allowed_users(allowed_roles=['super-admin', 'admin-type-1'])
def SubjectPage(request):
    subjectname = Subjects.objects.all()
    subjectcount = subjectname.count()
    subjectname = Subjects.objects.all()

    formfan = Subjects_Form()
    if request.method == "POST":
        formfan = Subjects_Form(request.POST)
        if formfan.is_valid():
            formfan.save()
            fannomi = formfan.cleaned_data.get('subject_name')
            messages.success(request, 'Fan yuklandi!  ' + fannomi)
            return redirect('subjectpage')

    context = {'formfan': formfan, 'subjectcount': subjectcount, 'subjectname': subjectname}
    return render(request, 'app1/subjectpage.html', context)


class ThemesForWhich(ListView):

    model = Themes
    template_name = 'app1/themeforwhich.html'
    paginate_by = 10
    context_object_name = 'themefil'

    def get_queryset(self):
        return Themes.objects.filter(responsible_section=self.request.user)

class ThemeAddList(UpdateView):
    model = Themes
    form_class = Themes_Form_for_admin_type_2
    #fields = ['first_name']
    template_name = 'app1/themeaddlist.html'
    #queryset=Employee.objects.all()
    success_url = 'themeforwhich'
    slug_field = 'slug2'



# -----------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
def Table(request):
    model = UserThemeStatus.objects.filter(user_name_id=request.user)
    formedit = UserThemeStatus_Form()
    if request.method == "POST":
        formedit = UserThemeStatus_Form(request.POST, request.FILES)
        if formedit.is_valid():
            listing = formedit.save(commit=False)
            listing.user_name_id = request.user
            listing.save()
            formedit.cleaned_data.get('__all__')
            #messages.success(request, "Mavzu yuklandi!" )
            return redirect('usert')
    context = {'model': model, 'formedit': formedit}
    return render(request, 'app1/usert.html', context)


# ------------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
def ErrorPage(request):
    context = {}
    return render(request, 'app1/error.html', context)


# -----------------------------------------------------------------------------------------------------------------------

@login_required(login_url='login')
@allowed_users(allowed_roles=['super-admin', 'admin-type-1'])
def AuthUserPage(request):
    user_list = User.objects.all()
    user_filter = UserFilter(request.GET, queryset=user_list)

    context = {
        'filters': user_filter
    }
    return render(request, 'app1/authuserpage.html', context)


# -----------------------------------------------------------------------------------------------------------------------

class TablePage1(ListView):
    model = Themes
    paginate_by = 10
    template_name = 'app1/tablepage1.html'
    filterset_class = ThemesFilter

    def get_queryset(self):
        queryset = super().get_queryset()
        self.filterset = self.filterset_class(self.request.GET, queryset=queryset)
        return self.filterset.qs.distinct()

    def get_context_data(self,  **kwargs):
        context = super().get_context_data(**kwargs)
        context['filterset'] = self.filterset
        return context


class TablePage1Detail(DetailView):
    model = Themes
    slug_field = 'url'
    template_name = 'app1/themelist.html'
    context_object_name = 'obj'
    #queryset = Themes.objects.all()
    #query_pk_and_slug = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context