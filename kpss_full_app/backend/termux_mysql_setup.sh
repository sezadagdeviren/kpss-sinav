#!/bin/bash
# =====================================================
# TERMUX'TA ÇALIŞTIR - MySQL Uzak Erişim Kurulumu
# =====================================================
# Her satırı ayrı ayrı kopyala ve Termux'ta çalıştır

echo "=== Adım 1: MySQL config dosyasını bul ==="
find $PREFIX/etc -name "my.cnf" 2>/dev/null
find $PREFIX/etc -name "*.cnf" 2>/dev/null | head -10

echo ""
echo "=== Adım 2: bind-address'i değiştir ==="
# Genellikle şu dosyada: /data/data/com.termux/files/usr/etc/mysql/my.cnf
sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' $PREFIX/etc/mysql/my.cnf
# Eğer satır yoksa ekle:
grep -q "bind-address" $PREFIX/etc/mysql/my.cnf || echo "bind-address = 0.0.0.0" >> $PREFIX/etc/mysql/my.cnf

echo "Güncel bind-address:"
grep "bind-address" $PREFIX/etc/mysql/my.cnf

echo ""
echo "=== Adım 3: MySQL'i yeniden başlat ==="
pkill -f mysqld 2>/dev/null
sleep 2
mysqld_safe --bind-address=0.0.0.0 &
sleep 3

echo ""
echo "=== Adım 4: Root için uzak erişim izni ver ==="
mysql -u root -e "
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
  FLUSH PRIVILEGES;
  SELECT user, host FROM mysql.user WHERE user='root';
"

echo ""
echo "=== Adım 5: Termux IP adresini öğren ==="
ip addr show wlan0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1
ifconfig 2>/dev/null | grep -A1 'wlan0' | grep inet | awk '{print $2}'

echo ""
echo "=== TAMAMLANDI ==="
echo "Bu IP adresini .env dosyasındaki DB_HOST değeri olarak kullan"
