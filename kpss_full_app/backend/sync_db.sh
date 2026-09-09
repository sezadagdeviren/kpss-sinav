#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  kpss_hub_db Senkronizasyon Aracı
#  Kullanım: bash sync_db.sh [push|pull|auto]
#
#  push → PC'den Termux'a aktar
#  pull → Termux'tan PC'ye aktar  
#  auto → Termux'u bul, hangisi güncel ise onu kullan
# ═══════════════════════════════════════════════════════════════

DB_NAME="kpss_hub_db"
PC_HOST="127.0.0.1"
PC_USER="root"
PC_PASS=""
TERMUX_PORT="3306"

# Son bilinen Termux IP'sini .env'den al
ENV_FILE="$(dirname "$0")/../.env"
TERMUX_HOST=$(grep '^DB_HOST=' "$ENV_FILE" 2>/dev/null | cut -d= -f2)

if [ -z "$TERMUX_HOST" ] || [ "$TERMUX_HOST" = "127.0.0.1" ]; then
  echo "⚠️  .env'de Termux IP bulunamadı. Ağ taranıyor..."
  for i in {1..254}; do
    ip="192.168.1.$i"
    if nc -z -w1 "$ip" 3306 2>/dev/null; then
      if mysql -h "$ip" -u root --connect-timeout=2 -e "USE $DB_NAME" 2>/dev/null; then
        TERMUX_HOST="$ip"
        echo "✅ Termux bulundu: $TERMUX_HOST"
        break
      fi
    fi
  done
fi

if [ -z "$TERMUX_HOST" ] || [ "$TERMUX_HOST" = "127.0.0.1" ]; then
  echo "❌ Termux bulunamadı. Telefonu açık tutun ve MySQL'in çalıştığından emin olun."
  exit 1
fi

MODE="${1:-auto}"

do_push() {
  echo "📤 PC → Termux aktarılıyor ($PC_HOST → $TERMUX_HOST)..."
  mysqldump -h "$PC_HOST" -u "$PC_USER" "$DB_NAME" 2>/dev/null | \
    mysql -h "$TERMUX_HOST" -u root "$DB_NAME" 2>/dev/null
  echo "✅ PC → Termux aktarımı tamamlandı."
}

do_pull() {
  echo "📥 Termux → PC aktarılıyor ($TERMUX_HOST → $PC_HOST)..."
  mysqldump -h "$TERMUX_HOST" -u root "$DB_NAME" 2>/dev/null | \
    mysql -h "$PC_HOST" -u "$PC_USER" "$DB_NAME" 2>/dev/null
  echo "✅ Termux → PC aktarımı tamamlandı."
}

if [ "$MODE" = "push" ]; then
  do_push
elif [ "$MODE" = "pull" ]; then
  do_pull
else
  # auto: Son değişiklik tarihine göre hangisi daha yeni ise diğerine aktar
  PC_COUNT=$(mysql -h "$PC_HOST" -u "$PC_USER" -sN -e "SELECT COUNT(*) FROM $DB_NAME.user_activity" 2>/dev/null)
  TX_COUNT=$(mysql -h "$TERMUX_HOST" -u root -sN -e "SELECT COUNT(*) FROM $DB_NAME.user_activity" 2>/dev/null)
  
  echo "📊 PC aktivite sayısı    : $PC_COUNT"
  echo "📊 Termux aktivite sayısı: $TX_COUNT"

  if [ "$TX_COUNT" -gt "$PC_COUNT" ] 2>/dev/null; then
    echo "ℹ️  Termux daha güncel → PC'ye aktarılıyor"
    do_pull
  elif [ "$PC_COUNT" -gt "$TX_COUNT" ] 2>/dev/null; then
    echo "ℹ️  PC daha güncel → Termux'a aktarılıyor"
    do_push
  else
    echo "✅ Her iki veritabanı zaten senkron."
  fi
fi
