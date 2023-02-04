package feedapp.insomniafest.ru.feedapp.common.util

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import feedapp.insomniafest.ru.feedapp.common.theme.FeedAppTheme

fun ComposeView.setThemedContent(content: @Composable () -> Unit) {
    setContent {
        FeedAppTheme {
            content.invoke()
        }
    }
}