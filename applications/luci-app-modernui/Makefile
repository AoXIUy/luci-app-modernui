include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-modernui
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-modernui
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=ModernUI - Modern LuCI Interface
  DEPENDS:=+luci-base +luci-theme-modernui
  PKGARCH:=all
endef

define Package/luci-app-modernui/description
  A modern UI/theme system for OpenWrt LuCI, featuring a React/Vite frontend,
  real-time dashboard, responsive design, dark mode support, and web terminal.
endef

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ./frontend $(PKG_BUILD_DIR)/
	$(CP) ./root $(PKG_BUILD_DIR)/
	$(CP) ./ucode $(PKG_BUILD_DIR)/
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-modernui/install
	$(INSTALL_DIR) $(1)/www/luci-static/modernui-app
	if [ -d $(PKG_BUILD_DIR)/frontend/dist ]; then \
		$(CP) $(PKG_BUILD_DIR)/frontend/dist/* $(1)/www/luci-static/modernui-app/; \
	elif [ -d ./frontend/dist ]; then \
		$(CP) ./frontend/dist/* $(1)/www/luci-static/modernui-app/; \
	fi
	$(INSTALL_DIR) $(1)/usr/share/rpcd/ucode
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/root/usr/share/rpcd/ucode/modernui.uc \
		$(1)/usr/share/rpcd/ucode/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/root/usr/share/rpcd/acl.d/luci-app-modernui.json \
		$(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/root/usr/share/luci/menu.d/luci-app-modernui.json \
		$(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/template/modernui
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/ucode/template/modernui/index.ut \
		$(1)/usr/share/ucode/luci/template/modernui/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(PKG_BUILD_DIR)/root/etc/config/modernui \
		$(1)/etc/config/
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/root/etc/uci-defaults/90_luci-app-modernui \
		$(1)/etc/uci-defaults/
	$(INSTALL_DIR) $(1)/lib/upgrade/keep.d
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/root/lib/upgrade/keep.d/luci-app-modernui \
		$(1)/lib/upgrade/keep.d/
endef

$(eval $(call BuildPackage,luci-app-modernui))
