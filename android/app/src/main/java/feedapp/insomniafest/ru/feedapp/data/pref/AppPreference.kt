package feedapp.insomniafest.ru.feedapp.data.pref

interface AppPreference {
    var login: String // обсудил, логин можно так хранить
    var lastUpdate: Long
    var eatingType: Int
}
