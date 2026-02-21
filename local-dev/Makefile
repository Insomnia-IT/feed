.PHONY: help start build up down restart backend admin shell logs logs-backend logs-admin migrate makemigrations stop clean

BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Путь к docker-compose
COMPOSE := docker-compose

help: ## Показать справку
	@echo "$(BLUE)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# --- Основные команды ---

start: ## Собрать и запустить проект
	@echo "$(GREEN)Сборка и запуск...$(NC)"
	$(COMPOSE) up --build -d

build: ## Собрать все контейнеры
	@echo "$(BLUE)Сборка контейнеров...$(NC)"
	$(COMPOSE) build

up: ## Запустить проект (в фоне)
	@echo "$(GREEN)Запуск проекта...$(NC)"
	$(COMPOSE) up -d

down: ## Остановить все контейнеры
	@echo "$(YELLOW)Остановка контейнеров...$(NC)"
	$(COMPOSE) down

restart: ## Перезапустить контейнеры
	@echo "$(YELLOW)Перезапуск...$(NC)"
	$(COMPOSE) restart

# --- Разработка ---

backend: ## Запустить только backend
	@echo "$(BLUE)Запуск только backend...$(NC)"
	@echo "$(YELLOW)Подключи отладчик в IDE и жди подключения$(NC)"
	$(COMPOSE) up backend

admin: ## Запустить только admin (фронт)
	@echo "$(BLUE)Запуск только admin...$(NC)"
	$(COMPOSE) up admin

shell: ## Войти в shell backend контейнера
	@echo "$(BLUE)Открываю shell backend...$(NC)"
	$(COMPOSE) exec backend bash

logs: ## Показать логи (follow mode)
	$(COMPOSE) logs -f

logs-backend: ## Логи только backend
	$(COMPOSE) logs -f backend

logs-admin: ## Логи только admin
	$(COMPOSE) logs -f admin

stop: ## Остановить debug-контейнеры
	$(COMPOSE) stop backend admin

clean: ## Остановить и удалить контейнеры, volumes, images
	@echo "$(RED)Очистка проекта...$(NC)"
	$(COMPOSE) down -v --rmi local

# --- Django команды ---

migrate: ## Выполнить миграции
	@echo "$(BLUE)Миграции...$(NC)"
	$(COMPOSE) exec backend python manage.py migrate

makemigrations: ## Создать миграции
	@echo "$(BLUE)Создание миграций...$(NC)"
	$(COMPOSE) exec backend python manage.py makemigrations