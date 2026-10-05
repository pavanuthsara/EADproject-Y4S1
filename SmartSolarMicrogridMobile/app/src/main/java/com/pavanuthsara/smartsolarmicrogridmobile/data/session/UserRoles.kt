package com.pavanuthsara.smartsolarmicrogridmobile.data.session

// Role names exactly as the API sends them (UserRole enum names).
object UserRoles {
    const val PROSUMER = "Prosumer"
    const val GRID_OPERATOR = "GridOperator"
    const val BACKOFFICE = "Backoffice"

    // True when the role is Prosumer (case-insensitive).
    fun isProsumer(role: String): Boolean = role.equals(PROSUMER, ignoreCase = true)

    // Backoffice staff may also use the operator dashboard on mobile.
    fun canUseOperatorDashboard(role: String): Boolean =
        role.equals(GRID_OPERATOR, ignoreCase = true) || role.equals(BACKOFFICE, ignoreCase = true)
}
