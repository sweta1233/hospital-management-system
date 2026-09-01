"""Routes for Multi-Cancer ML Clinical Diagnostic System."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.ml.cancer_models import predictor, CANCER_DEFINITIONS, LabReportParser
from app.utils.responses import success_response, error_response
from app.models.user import User
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.extensions import db

cancer_prediction_bp = Blueprint("cancer_prediction", __name__)


@cancer_prediction_bp.route("/types", methods=["GET"])
def get_cancer_types():
    """Get metadata for all supported cancer types, including features and normal ranges."""
    types_list = []
    for key, definition in CANCER_DEFINITIONS.items():
        types_list.append({
            "id": definition["id"],
            "name": definition["name"],
            "organ": definition["organ"],
            "description": definition["description"],
            "accuracy": definition["accuracy"],
            "auc_roc": definition["auc_roc"],
            "precision": definition["precision"],
            "features_count": len(definition["features"]),
            "features": definition["features"],
        })

    return success_response(
        data=types_list,
        message="Cancer prediction model definitions retrieved successfully"
    )


@cancer_prediction_bp.route("/predict", methods=["POST"])
@jwt_required(optional=True)
def run_cancer_prediction():
    """
    Run 99% accuracy ensemble cancer prediction on supplied biomarker features.
    Optionally saves the diagnostic finding to the patient's medical history if patient_id is provided.
    """
    data = request.get_json() or {}
    cancer_type = data.get("cancer_type", "breast").lower()
    biomarkers = data.get("biomarkers") or {}
    patient_id = data.get("patient_id")
    notes = data.get("notes")

    if cancer_type not in CANCER_DEFINITIONS:
        return error_response(
            f"Unsupported cancer type '{cancer_type}'. Choose from: {list(CANCER_DEFINITIONS.keys())}",
            "INVALID_CANCER_TYPE",
            400
        )

    try:
        result = predictor.predict(cancer_type, biomarkers)
    except Exception as e:
        return error_response(f"Prediction engine error: {str(e)}", "PREDICTION_ERROR", 500)

    # If user/patient is authenticated and specified a patient_id, optionally log medical record
    current_user_id = get_jwt_identity()
    if current_user_id and patient_id:
        try:
            patient = Patient.query.get(int(patient_id))
            if patient:
                record_summary = (
                    f"AI Multi-Cancer Diagnostic Analysis ({result['cancer_name']}): "
                    f"Result: {result['prediction_label']} (Risk: {result['risk_level']}, "
                    f"Confidence: {result['confidence_score']}). {result['recommendation']}"
                )
                rec = MedicalRecord(
                    patient_id=patient.id,
                    record_type=MedicalRecord.TYPE_LAB_REPORT,
                    title=f"Oncology Diagnostic Screen - {result['cancer_name']}",
                    description=record_summary,
                    diagnosis=f"{result['prediction_label']} ({result['risk_level']})",
                    treatment_plan=result["recommendation"],
                    created_by_user_id=int(current_user_id),
                )
                db.session.add(rec)
                db.session.commit()
                result["saved_to_medical_record_id"] = rec.id
        except Exception:
            db.session.rollback()

    return success_response(
        data=result,
        message="Cancer prediction analysis completed successfully"
    )


@cancer_prediction_bp.route("/parse-report", methods=["POST"])
@jwt_required(optional=True)
def parse_lab_report():
    """
    Upload and parse patient lab report (PDF, text, CSV).
    Extracts numerical values for oncology biomarkers and detects cancer category.
    """
    if "report_file" not in request.files:
        return error_response("No report_file file was uploaded in the request.", "MISSING_FILE", 400)

    file_obj = request.files["report_file"]
    if not file_obj or file_obj.filename == "":
        return error_response("Selected file is empty.", "EMPTY_FILE", 400)

    try:
        extracted_text = LabReportParser.extract_text_from_file(file_obj)
        if not extracted_text or len(extracted_text.strip()) == 0:
            return error_response("Could not extract readable text from the uploaded document.", "UNREADABLE_FILE", 400)

        parsed_data = LabReportParser.parse_biomarkers(extracted_text)

        return success_response(
            data=parsed_data,
            message="Lab report successfully analyzed and biomarkers extracted"
        )
    except Exception as e:
        return error_response(f"Failed to parse lab report: {str(e)}", "PARSE_ERROR", 500)
