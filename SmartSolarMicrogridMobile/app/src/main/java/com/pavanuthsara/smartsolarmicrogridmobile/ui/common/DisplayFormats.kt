package com.pavanuthsara.smartsolarmicrogridmobile.ui.common

import android.content.Context
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.RelativeSizeSpan
import androidx.core.content.ContextCompat
import com.pavanuthsara.smartsolarmicrogridmobile.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

// How API values are shown on screen. Display only: the API decides every rule.
object DisplayFormats {

    private const val ISO_SECONDS_LENGTH = 19 // "2026-10-08T09:00:00"

    // Reads a UTC ISO-8601 time such as "2026-10-08T09:00:00Z" (fractions of a second are ignored).
    fun parseUtc(iso: String): Date? {
        if (iso.length < ISO_SECONDS_LENGTH) return null
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            format.timeZone = TimeZone.getTimeZone("UTC")
            format.parse(iso.substring(0, ISO_SECONDS_LENGTH))
        } catch (e: Exception) {
            null
        }
    }

    // Day heading in the phone's time zone, e.g. "Thu, 8 Oct".
    fun day(iso: String): String = format(iso, "EEE, d MMM")

    // Start and end in the phone's time zone, e.g. "09:00 - 10:00".
    fun timeRange(startIso: String, endIso: String): String =
        "${format(startIso, "HH:mm")} - ${format(endIso, "HH:mm")}"

    // Day and time range on one line, e.g. "Thu, 8 Oct, 09:00 - 10:00".
    fun dayAndTimeRange(startIso: String, endIso: String): String =
        "${day(startIso)}, ${timeRange(startIso, endIso)}"

    // Group key that sorts by date: the calendar day in the phone's time zone.
    fun dayKey(iso: String): String = format(iso, "yyyy-MM-dd")

    fun kwh(value: Double): String {
        val rounded = Math.round(value * 100) / 100.0
        return if (rounded % 1.0 == 0.0) "${rounded.toLong()} kWh" else "$rounded kWh"
    }

    private fun format(iso: String, pattern: String): String {
        val date = parseUtc(iso) ?: return iso
        return SimpleDateFormat(pattern, Locale.getDefault()).format(date)
    }
}

// Energy directions. The API uses Inject and Draw; the app shows the spec's names with the
// API word as a small hint.
object DirectionLabels {

    const val INJECT = "Inject"
    const val DRAW = "Draw"

    // "Energy Drop-off" or "Energy Charging", without the hint.
    fun title(direction: String): String = when (direction) {
        INJECT -> "Energy Drop-off"
        DRAW -> "Energy Charging"
        else -> direction
    }

    // The title followed by the API word in a smaller size, e.g. "Energy Drop-off (Inject)".
    fun withHint(direction: String): CharSequence {
        val text = SpannableStringBuilder(title(direction))
        if (direction == INJECT || direction == DRAW) {
            val start = text.length
            text.append(" ($direction)")
            text.setSpan(RelativeSizeSpan(0.8f), start, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        return text
    }
}

object StatusColors {

    // Text colour for a reservation status.
    fun of(context: Context, status: String): Int = ContextCompat.getColor(
        context,
        when (status) {
            "Approved", "Completed" -> R.color.status_approved
            "Rejected" -> R.color.status_error
            "Cancelled" -> R.color.text_muted
            else -> R.color.status_pending
        }
    )
}
