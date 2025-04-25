# insomnia-autotests
# регресс тесты 

### Используем
pytest, selenium

## Запуск
```
# получить окружение и либы
python -m venv venv
. venv/bin/activate
pip install -r requiments.txt

pytest # запустить тесты в файлах test_***.py
pytest test_resgress.py other.py # запустить тесты в конкретных файлах
```


## Запуск в докере
```
. run_tests.sh
или
bash -c ". run_tests.sh" ; echo "exit_code is $?"
```

