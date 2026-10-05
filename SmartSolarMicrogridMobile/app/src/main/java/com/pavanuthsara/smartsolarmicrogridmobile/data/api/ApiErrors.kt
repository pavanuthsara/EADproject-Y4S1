package com.pavanuthsara.smartsolarmicrogridmobile.data.api

import com.google.gson.JsonElement
import com.google.gson.JsonParseException
import com.google.gson.JsonParser

// Turns an API error body into a message the user can act on. The API returns its
// ApiResponse envelope ({ success, message, data }) for rule failures, an ASP.NET
// ProblemDetails body ({ title, errors }) for invalid input, and an empty body for 401/403.
object ApiErrors {

    // Returns the best message from the error body, or a message based on the status code.
    fun message(errorBody: String?, statusCode: Int, fallback: String): String {
        val fromBody = errorBody?.takeIf { it.isNotBlank() }?.let(::readMessage)
        return fromBody ?: when (statusCode) {
            401 -> "Your session has expired. Please sign in again."
            403 -> "Your account is deactivated or lacks access. Contact Backoffice to approve reactivation."
            else -> fallback
        }
    }

    // Pulls a readable error message out of an API error body; returns null if there is none.
    private fun readMessage(body: String): String? {
        val root = try {
            JsonParser.parseString(body)
        } catch (e: JsonParseException) {
            return null
        }
        if (!root.isJsonObject) return null
        val obj = root.asJsonObject

        textOf(obj.get("message"))?.let { return it }

        val errors = obj.get("errors")
        if (errors != null && errors.isJsonObject) {
            for ((_, value) in errors.asJsonObject.entrySet()) {
                if (value.isJsonArray) {
                    value.asJsonArray.firstOrNull()?.let(::textOf)?.let { return it }
                }
            }
        }

        return textOf(obj.get("title"))
    }

    // Returns the element's text if it is a non-blank string, otherwise null.
    private fun textOf(element: JsonElement?): String? =
        element?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
}
