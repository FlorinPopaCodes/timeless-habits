import base64
import hashlib
import hmac
import json
import requests
import uuid
import os
import re
import sentry_sdk
from sentry_sdk.integrations.serverless import serverless_function


def check_signature(request_data, key):
    if 'X-Todoist-Hmac-Sha256' not in request_data.headers.keys():
        return False

    local_digest = hmac.new(bytes(key, 'utf-8'), request_data.data, digestmod=hashlib.sha256).digest()
    received_digest = base64.b64decode(bytes(request_data.headers['X-Todoist-Hmac-Sha256'], 'utf-8'))

    return hmac.compare_digest(local_digest, received_digest)


def check_task(title):
    SAFETY_PIN = '🧷'
    return SAFETY_PIN in title


def duplicate_task(old_task):
    # TODO get user's token based on the payload user; otherwise return 403

    requests.post(
        "https://api.todoist.com/rest/v1/tasks",
        data=json.dumps({
            "content": old_task['content'],
            "project_id": old_task['project_id'],
            "section_id": old_task['section_id'],
            "parent": old_task['parent_id'],
            "order": old_task['child_order'],
            "label_ids": old_task['labels'],
            "priority": old_task['priority']
        }),
        headers={
            "Content-Type": "application/json",
            "X-Request-Id": str(uuid.uuid4()),
            "Authorization": "Bearer %s" % os.environ.get('USER_TOKEN')
        }).json()


sentry_sdk.init(dsn=os.environ.get('SENTRY_DSN'))


@serverless_function
def webhooks(request):
    if not check_signature(request, os.environ.get('TODOIST_CLIENT_SECRET')):
        return '', 403

    if check_task(request.json['event_data']['content']):
        duplicate_task(request.json['event_data'])

    return '', 204
