package feedapp.insomniafest.ru.feedapp.presentation.statistics

import android.app.DatePickerDialog
import android.widget.DatePicker
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import feedapp.insomniafest.ru.feedapp.domain.model.FeedType

@Composable
internal fun StatisticsView(
    state: StatisticsState,
    onDateChange: (Int, Int, Int) -> Unit,
    onToggleFeedType: (FeedType) -> Unit,
) {
    // TODO чекнуть рекомпозиции
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        DatePickerView(state.year, state.month, state.day, onDateChange)

        FeedTypeToggle(state.selectFeedType, onToggleFeedType)

        StatisticsGrid(state)
    }
}

@Composable
fun FeedTypeToggle(selectFeedType: FeedType, onToggleFeedType: (FeedType) -> Unit) {
    val feedTypes = listOf(FeedType.UNKNOWN, FeedType.MEAT_EATER, FeedType.VEGETARIAN)

    Spacer(modifier = Modifier.size(30.dp))
    Box(modifier = Modifier) {
        val expanded = remember { mutableStateOf(false) }
        Button(
            onClick = { expanded.value = true },
            colors = ButtonDefaults.buttonColors(backgroundColor = Color(0xFFFF9800))
        ) {
            Text(
                text = selectFeedType.convert2String(), color = Color.White, fontSize = 30.sp,
            )
        }
        DropdownMenu(
            expanded = expanded.value,
            onDismissRequest = { expanded.value = false }
        ) {
            feedTypes.forEach {
                DropdownMenuItem(onClick = {
                    onToggleFeedType.invoke(it)
                    expanded.value = false
                }) {
                    Text(it.convert2String())
                }
            }
        }
    }
}

@Composable
private fun StatisticsGrid(
    state: StatisticsState,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            GridCell("")
            GridCell("Факт")
            GridCell("На поле")
        }
        for (row in state.statistics) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                GridCell(row.eatingType.toString())
                GridCell(row.fact.toString(), true)
                GridCell(row.planned.toString(), true)
            }
        }
    }
}

@Composable
private fun RowScope.GridCell(text: String, isDigit: Boolean = false) {
    Box(
        modifier = Modifier
            .height(64.dp)
            .weight(1f)
            .border(1.dp, Color.Black)
    ) {
        Text(
            modifier = Modifier.align(Alignment.Center),
            text = text,
            style = TextStyle(fontSize = if (isDigit) 30.sp else 25.sp),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun DatePickerView(
    mYear: Int,
    mMonth: Int,
    mDay: Int,
    onDateChange: (Int, Int, Int) -> Unit,
) {
    // инициализируем пикер
    val mDatePickerDialog = DatePickerDialog(
        LocalContext.current,
        { _: DatePicker, year: Int, month: Int, day: Int ->
            onDateChange.invoke(year, month, day) // перезагружаем статистику
        }, mYear, mMonth, mDay
    )

    Spacer(modifier = Modifier.size(30.dp))
    Button(
        onClick = { mDatePickerDialog.show() },
        colors = ButtonDefaults.buttonColors(backgroundColor = Color(0XFF0F9D58))
    ) {
        Text(text = "Выбрать дату", color = Color.White)
    }
    Spacer(modifier = Modifier.size(10.dp))
    Text(
        text = "Выбранная дата: $mDay/${mMonth + 1}/$mYear",
        fontSize = 30.sp,
        textAlign = TextAlign.Center
    )
}

private fun FeedType.convert2String() = when (this) {
    FeedType.UNKNOWN -> "Всего"
    FeedType.MEAT_EATER -> "Мясоеды"
    FeedType.VEGETARIAN -> "Веганы"
}
