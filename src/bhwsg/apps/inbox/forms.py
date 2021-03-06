import string
import random
from django import forms
from django.forms.models import inlineformset_factory
from django.contrib.auth.models import User
from django.db import transaction
from django.db import IntegrityError
from django.core.mail import send_mail
from django.template.loader import render_to_string

from core.utils import generate_username, memoize_method
from models import Inbox, ForwardRule, DeleteRule


class InboxCreateForm(forms.ModelForm):
    class Meta:
        model = Inbox
        fields = ('title',)

    def __init__(self, *args, **kwargs):
        self.owner = kwargs.pop('owner', None)
        super(InboxCreateForm, self).__init__(*args, **kwargs)

    def save(self, *args, **kwargs):
        self.instance.password = ''.join([random.choice(string.letters) for i in xrange(6)])
        self.instance.owner = self.owner
        return super(InboxCreateForm, self).save(*args, **kwargs)


class ForwardRuleForm(forms.ModelForm):
    class Meta:
        model = ForwardRule

ForwardRuleFormSet = inlineformset_factory(
    Inbox, ForwardRule, extra=1, can_delete=True,
    form=ForwardRuleForm
)


class DeleteRuleForm(forms.ModelForm):
    class Meta:
        model = DeleteRule

DeleteRuleFormSet = inlineformset_factory(
    Inbox, DeleteRule, extra=1, can_delete=True,
    form=DeleteRuleForm
)


class UserCreateForm(forms.ModelForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('email',)

    def __init__(self, *args, **kwargs):
        self.inbox = kwargs.pop('inbox', None)
        super(UserCreateForm, self).__init__(*args, **kwargs)

    @memoize_method
    def existing_user(self, email):
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
        else:
            user = None
        return user

    def clean_email(self):
        email = self.cleaned_data['email']
        user = self.existing_user(email)
        if user and self.inbox and self.inbox.users.filter(id=user.id).exists():
            raise forms.ValidationError("Already here!")
        return email

    def save(self, *args, **kwargs):
        email = self.cleaned_data['email']
        user = self.existing_user(email)
        mail_title = 'Congratulations! New inbox.'
        if user:
            message = render_to_string('inbox/inbox-team-new-member.html', {
                'inbox': self.inbox, 'email': user.email, })
            send_mail(mail_title, message, 'hyi@exampe.com', [email])
        else:
            for username in generate_username(email):
                try:
                    sid = transaction.savepoint()
                    password = ''.join([random.choice(string.letters) for i in xrange(6)])
                    user = User.objects.create_user(
                        username, self.cleaned_data['email'], password
                    )
                except IntegrityError:
                    transaction.savepoint_rollback(sid)
                else:
                    message = render_to_string('inbox/inbox-team-new-member.html', {
                        'inbox': self.inbox, 'email': user.email, 'password': password})
                    send_mail(mail_title, message, 'hyi@exampe.com', [email])
                    break
        return user
