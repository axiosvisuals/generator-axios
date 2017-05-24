#!/usr/bin/env python

# Authors
# @onyxfish github.com/onyxfish
# @TylerFisher github.com/TylerFisher
# @eads github.com/eads
# @suymilk github.com/suymilk

import csv
import getpass
import json
import logging
import os
import re

import requests
from requests.auth import HTTPBasicAuth
from time import sleep

LOG_FORMAT = '%(levelname)s:%(name)s:%(asctime)s: %(message)s'

logging.basicConfig(format=LOG_FORMAT)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def get_auth():
    """
    Construct a basic auth object from a username and password
    """
    username = raw_input('Username: ')
    password = getpass.getpass('Password: ')

    auth = HTTPBasicAuth(username, password)

    # Test auth by requesting repo events
    response = requests.get('https://api.github.com/notifications', auth=auth)

    if response.status_code == 401:
        otp = response.headers.get('X-Github-OTP')
        if otp and otp.startswith('required'):
            logger.warn('You are using 2-factor authentication. Please create a personal access token at https://github.com/settings/applications#personal-access-tokens and provide it here')
            access_token = raw_input('Personal access token: ')
            auth = HTTPBasicAuth(access_token, '')
        else:
            raise Exception('Invalid username or password')

    return auth

def get_repo_path():
    """
    Extract the repository url from the gitconfig file.
    """
    with open('.git/config') as f:
        gitconfig = f.read()

    match = re.search('(git@github.com:|https://github.com/)(.+)/(.+).git', gitconfig)
    repo_username = match.group(2)
    repo_name = match.group(3)

    return '%s/%s' % (repo_username, repo_name)

def delete_existing_labels(auth):
    """
    Delete labels currently on the repository
    """
    url = 'https://api.github.com/repos/%s/labels' % get_repo_path()

    response = requests.get(url, auth=auth)
    labels = json.loads(response.content)

    logger.info('Deleting %i labels' % len(labels))

    for label in labels:
        logger.info('Deleting label %s' % label['name'])

        requests.delete(url + '/' + label['name'], auth=auth)

def create_labels(auth, filename='etc/default_labels.csv'):
    """
    Creates labels in Github issues.
    """
    url = 'https://api.github.com/repos/%s/labels' % get_repo_path()

    with open(filename) as f:
        labels = list(csv.DictReader(f))

    logger.info('Creating %i labels' % len(labels))

    for label in labels:
        logger.info('Creating label "%s"' % label['name'])
        data = json.dumps(label)

        requests.post(url, data=data, auth=auth)

def create_tickets(auth, filename='etc/default_tickets.csv'):
    """
    Creates tickets in Github issues.
    """
    url = 'https://api.github.com/repos/%s/issues' % get_repo_path()

    with open(filename) as f:
        tickets = list(csv.DictReader(f))

    logger.info('Creating %i tickets' % len(tickets))

    for ticket in tickets:
        logger.info('Creating ticket "%s"' % ticket['title'])

        if ticket['labels']:
            ticket['labels'] = ticket['labels'].split(',')
        else:
            ticket['labels'] = []

        ticket['labels'].append('Default Ticket')

        data = json.dumps(ticket)

        requests.post(url, data=data, auth=auth)

        # avoid approximately 30 tickets/minute rate limit
        sleep(5)

def bootstrap():
    """
    Bootstraps Github issues with default configuration.
    """

    auth = get_auth()
    delete_existing_labels(auth)
    create_labels(auth)
    create_tickets(auth)
    create_milestones(auth)
    create_hipchat_hook(auth)

bootstrap()
