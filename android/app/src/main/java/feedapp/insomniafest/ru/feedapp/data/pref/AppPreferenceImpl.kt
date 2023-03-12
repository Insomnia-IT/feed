package feedapp.insomniafest.ru.feedapp.data.pref

import android.content.Context
import javax.inject.Inject

class AppPreferenceImpl @Inject constructor(context: Context) : AppPreference {

    companion object {
        const val LOGIN = "login"
        const val LAST_UPDATE = "last_update"
        const val LAST_TRANSACTION = "last_transaction"
    }

    private var preference = context.getSharedPreferences("app-pref", Context.MODE_PRIVATE)
    private var editor = preference.edit()

    override var login: String
        get() = getString(LOGIN)
        set(value) {
            saveString(LOGIN, value)
        }

    override var lastUpdate: Long
        get() = getLong(LAST_UPDATE)
        set(value) {
            saveLong(LAST_UPDATE, value)
        }
    override var lastTransaction: Int
        get() = getInt(LAST_TRANSACTION)
        set(value) {
            saveInt(LAST_TRANSACTION, value)
        }

    private fun saveString(key: String, value: String) {
        editor.putString(key, value).apply()
    }

    private fun getString(key: String, defaultValue: String = ""): String {
        return preference.getString(key, defaultValue) ?: defaultValue
    }

    private fun saveInt(key: String, value: Int) {
        editor.putInt(key, value).apply()
    }

    private fun getInt(key: String, defaultValue: Int = 0): Int {
        return preference.getInt(key, defaultValue)
    }

    private fun saveLong(key: String, value: Long) {
        editor.putLong(key, value).apply()
    }

    private fun getLong(key: String, defaultValue: Long = 0): Long {
        return preference.getLong(key, defaultValue)
    }
}
