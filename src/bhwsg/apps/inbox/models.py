from django.db import models
from django.contrib.auth.models import User


class Inbox(models.Model):
    slug = models.CharField("SMTP login/Permalink", max_length=255, unique=True,)
    password = models.CharField(max_length=255)
    users = models.ManyToManyField(User, related_name='inboxes')

    class Meta:
        ordering = ('slug',)

    def __unicode__(self):
        return self.title

    @property
    def login(self):
        return self.slug


class Mail(models.Model):
    inbox = models.ForeignKey(Inbox, related_name="mails")
    peer = models.CharField(max_length=255, blank=True, null=True)
    from_email = models.CharField(max_length=255)
    to_email = models.TextField()
    raw = models.TextField(blank=True, null=True)
    subject = models.TextField(max_length=255, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    uuid = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)

    def __unicode__(self):
        return u'Mail for %s' % self.inbox
