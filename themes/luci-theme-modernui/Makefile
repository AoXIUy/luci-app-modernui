include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-modernui
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/luci-theme-modernui
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=4. Themes
  TITLE:=ModernUI Theme for LuCI
  DEPENDS:=+luci-base
  PKGARCH:=all
endef

define Package/luci-theme-modernui/description
  Modern login page theme for OpenWrt LuCI.
  Pairs with luci-app-modernui.
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-theme-modernui/install
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/template/themes/modernui
	$(INSTALL_DATA) ./root/usr/share/ucode/luci/template/themes/modernui/sysauth.ut \
		$(1)/usr/share/ucode/luci/template/themes/modernui/
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/30_luci-theme-modernui \
		$(1)/etc/uci-defaults/
endef

define Package/luci-theme-modernui/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q get luci.themes.ModernUI >/dev/null || {
		uci set luci.themes.ModernUI='/luci-static/modernui'
		uci commit luci
	}
}
exit 0
endef

$(eval $(call BuildPackage,luci-theme-modernui))
