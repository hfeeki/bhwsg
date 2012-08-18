from django.conf.urls import patterns, include, url
from django.contrib import admin

from apps.core.views import home

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    (r'^accounts/', include('registration.backends.simple.urls')),

    url(r'^$', home, name="home"),
)
