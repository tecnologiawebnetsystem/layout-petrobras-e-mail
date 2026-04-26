from sqlmodel import SQLModel

# importe todos os modelos que devem ir para migração
from .area import SharedArea
from .areasupervisors import AreaSupervisor
from .audit import Audit
from .credencial_local import CredentialLocal
from .email_log import EmailLog
from .notification import Notification
from .restricted_file import RestrictedFile
from .session_token import SessionToken
from .share_file import ShareFile
from .share import Share
from .token_access import TokenAccess
from .user import User
from .support_registration import SupportRegistration
from .support_audit import SupportAudit
