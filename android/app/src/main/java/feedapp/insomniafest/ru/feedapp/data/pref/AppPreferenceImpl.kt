package feedapp.insomniafest.ru.feedapp.data.pref

import android.content.Context
import javax.inject.Inject

class AppPreferenceImpl @Inject constructor(context: Context): AppPreference {

    companion object {
        const val LOGIN = "login"
    }

    private var preference = context.getSharedPreferences("app-pref", Context.MODE_PRIVATE)
    private var editor = preference.edit()

    override var login: String
        get() = getString(LOGIN)
        set(value) {
            saveString(LOGIN, value)
        }

    private fun saveString(key: String, value: String) {
        editor.putString(key, value).apply()
    }

    private fun getString(key: String, defaultValue: String = ""): String {
        return preference.getString(key, defaultValue) ?: defaultValue
    }
}
