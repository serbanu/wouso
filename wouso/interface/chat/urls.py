
from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^$','wouso.interface.chat.views.index'),
    (r'^m/$','wouso.interface.chat.views.sendmessage'),
    (r'^last/$','wouso.interface.chat.views.online_players'),
    (r'^log/$','wouso.interface.chat.views.log_request'),
    (r'^privateLog/$','wouso.interface.chat.views.log')
)

