from rest_framework import viewsets
import logging

logger = logging.getLogger(__name__)

class LoggingModelViewSet(viewsets.ModelViewSet):
    model_verbose_name = "объект"  # Переопредели в потомке

    def log(self, action, request, pk=None):
        user = request.user
        msg = f"User {user} is attempting to {action} {self.model_verbose_name}"
        if pk:
            msg += f" with pk={pk}"
        logger.info(msg)

    def list(self, request, *args, **kwargs):
        self.log("list", request)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        self.log("create", request)
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        self.log("retrieve", request, kwargs.get("pk"))
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.log("update", request, kwargs.get("pk"))
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.log("partial update", request, kwargs.get("pk"))
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.log("delete", request, kwargs.get("pk"))
        return super().destroy(request, *args, **kwargs)