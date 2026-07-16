from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.exceptions import ValidationError
from .serializers import TagSerializer,CVCreateSerializer,CVSerializer
from .selectors import get_cv_list_service
from .services import create_cv_service,delete_cv_service
# Create your views here.

class CVManageView(APIView):
    permission_classes = [IsAuthenticated]
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
    def delete(self,request):
        cv_id = request.query_params.get('id')
        if not cv_id:
            raise ValidationError({'detail':'Vui long chon CV muon xoa'})
        delete_cv_service(user=request.user,cv_id=cv_id)
        return Response({'message':'Xoa thanh cong'},status=status.HTTP_200_OK)