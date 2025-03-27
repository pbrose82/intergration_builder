
from flask import Blueprint, render_template, request, jsonify
from simple_salesforce import Salesforce
from app import db
from app.models import SalesforceIntegration, SalesforceIntegrationSchema
from services.alchemy import get_alchemy_access_token, get_alchemy_record_types
import requests
import logging

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/get-alchemy-record-types', methods=['POST'])
def get_record_types():
    try:
        data = request.get_json()
        tenant_id = data.get("tenant_id")
        refresh_token = data.get("refresh_token")

        if not tenant_id or not refresh_token:
            return jsonify({"error": "Missing tenant_id or refresh_token"}), 400

        access_token = get_alchemy_access_token(refresh_token, tenant_id)
        if not access_token:
            return jsonify({"error": "Unable to get access token"}), 401

        record_types = get_alchemy_record_types(access_token, tenant_id)
        if not record_types:
            return jsonify({"error": "Failed to fetch record types"}), 500

        return jsonify({"recordTypes": record_types})

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
