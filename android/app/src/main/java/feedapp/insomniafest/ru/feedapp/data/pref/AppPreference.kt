package feedapp.insomniafest.ru.feedapp.data.pref

interface AppPreference {
    var login: String
    var lastUpdate: Long
    var lastTransaction: Int
    var eatingType: Int
}
