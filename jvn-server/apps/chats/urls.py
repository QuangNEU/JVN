from django.urls import path
from . import views
urlpatterns = [
    path('direct/', views.CreateOrGetDirectConversationView.as_view(), name='direct-conversation'),
    path('group/', views.CreateGroupConversationView.as_view(), name='create-group-conversation'),
    path('', views.GetConversationList.as_view(), name='conversation-list'),
    path('<int:conversation_id>/messages/', views.SendMessageView.as_view(), name='send-message'),
    path('<int:conversation_id>/messages/', views.GetConversationMessagesView.as_view(), name='get-conversation-messages'),
    path('ws-ticket/', views.WsTicketView.as_view(), name='ws-ticket'),
]