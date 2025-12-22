"""
Permissions for Event API endpoints
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrgMemberOrSuperuser(BasePermission):
    """
    Permission to access events if:
    - user is superuser, or
    - event belongs to an organization where the user is a member.
    
    Validates both list and object-level access.
    """
    def has_permission(self, request, view):
        """Allow access if user is authenticated"""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check object-level permissions"""
        if request.user.is_superuser:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Check if user is member of event's organization
        if obj.organization:
            return request.user.org_memberships.filter(
                organization=obj.organization
            ).exists()
        
        # If event has no organization, only superuser can access
        return False


class CanPublishEvent(BasePermission):
    """
    Permission to publish events (set is_published=True).
    Only allows publishing if user has events.publish_event permission.
    """
    def has_permission(self, request, view):
        """Allow read operations, require authentication for writes"""
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check publish permission for write operations"""
        if request.method in SAFE_METHODS:
            return True
        
        # Check publish permission only when trying to publish
        if request.method in ("PUT", "PATCH"):
            is_publishing = (
                request.data and 
                request.data.get("is_published") is True
            )
            if is_publishing:
                return (
                    request.user.is_superuser or 
                    request.user.has_perm("events.publish_event")
                )
        
        return True

