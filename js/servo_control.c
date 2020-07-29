//------------------------------------------------------------------------------
// set per-frame sinusoidal velocity
// h  --> hindge joint to control
// cp --> sinusoidal control parameters
void updateHinge(dJointID h, const ControlParams &cp)
{
    // target angular velocity for the "motor"
    dReal fAngVel;

    // get the current hinge angle
    dReal fCurAngle = dJointGetHingeAngle(h);

    // calculate the next hinge angle
    dReal fTargetAngle = cp.AMP * sin(cp.OMG * cp.time) + cp.BIA;

    // use the error between target and current to set the hinge velocity
    dReal fErrorAngle = fTargetAngle - fCurAngle;
    if (fErrorAngle > 0) fAngVel = cp.ANG_VEL_MAX;
    else fAngVel = - cp.ANG_VEL_MAX;

    if (fabs(fErrorAngle) <= cp.ANG_VEL_MAX * cp.STEP_SIZE) {
        fAngVel *= fabs(fErrorAngle)/(cp.ANG_VEL_MAX * cp.STEP_SIZE);
    }

    // set the motor velocity
    dJointSetHingeParam(h, dParamVel, fAngVel);
}
