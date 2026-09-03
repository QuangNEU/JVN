from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.exceptions import ValidationError
from core.permission import IsAuthenticatedAndNotLocked
from .serializers import TagSerializer,CVCreateSerializer,CVSerializer,CVUpdateSerializer
from .selectors import get_cv_list_service,get_cv_selector,get_tag
from .services import create_cv_service,delete_cv_service,set_default_service,update_cv_service,public_cv_service
# Create your views here.

class CVManageView(APIView):
    permission_classes = [IsAuthenticatedAndNotLocked]
    def post(self,request):
        serializer = CVCreateSerializer(data= request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user
        create_cv_service(user = user,data=data)
        return Response({
            'message':'Them CV thanh cong'
        },status= status.HTTP_200_OK)
    def get(self,request):
        cvs = get_cv_list_service(user=request.user)
        result = CVSerializer(cvs,many =True)
        return Response(result.data,status=status.HTTP_200_OK)
    
    
class CVDetailView(APIView):
    permission_classes=[IsAuthenticatedAndNotLocked]
    def get(self,request,cv_id):
        cv = get_cv_selector(user=request.user,cv_id=cv_id)
        serialize = CVSerializer(cv)
        return Response(serialize.data,status=status.HTTP_200_OK)
    def delete(self,request, cv_id):
        # cv_id = request.query_params.get('id')
        if not cv_id:
            raise ValidationError({'detail':'Vui long chon CV muon xoa'})
        delete_cv_service(user=request.user,cv_id=cv_id)
        return Response({'message':'Xoa thanh cong'},status=status.HTTP_200_OK)
    
class CVSetDefaultView(APIView):
    permission_classes=[IsAuthenticatedAndNotLocked]
    def post(self, request, cv_id):
        cv = set_default_service(user=request.user,cv_id= cv_id)
        return Response({
            "message": f"Đã thiết lập CV '{cv.title}' làm CV mặc định.",
            "cv_id": cv.id,
            "is_default": cv.is_default
        },status=status.HTTP_200_OK)
    
class CVUpdateView(APIView):
    permission_classes=[IsAuthenticatedAndNotLocked]
    def patch(self,request,cv_id):
        serializer = CVUpdateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        update_cv_service(user=request.user,data= data,cv_id=cv_id)
        return Response({'message':'Cap nhat cv thanh cong'},status=status.HTTP_200_OK)
    
class CVPublicView(APIView):
    permission_classes= [IsAuthenticatedAndNotLocked]
    def post(self,request,cv_id):
        cv = public_cv_service(user=request.user,cv_id=cv_id)
        status_text = "công khai" if cv.is_public else "ẩn"
        return Response({
            "message": f"Đã {status_text} CV '{cv.title}'.",
            "is_public": cv.is_public
        },status=status.HTTP_200_OK)


class TagListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        tags = get_tag()
        return Response(TagSerializer(tags, many = True).data, status= status.HTTP_200_OK)