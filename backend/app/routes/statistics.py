from flask import Blueprint, jsonify
from app.models.statistics import Statistics

stats_bp = Blueprint('statistics', __name__)

@stats_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get statistics endpoint"""
    return jsonify(Statistics.get_statistics()) 