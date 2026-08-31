# Makefile — modernui-console OpenWrt package

include $(TOPDIR)/rules.mk

PKG_NAME:=modernui-console
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/modernui-console
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=ModernUI Console PTY Daemon
  DEPENDS:=+libc
endef

define Package/modernui-console/description
  Secure PTY session daemon for ModernUI web terminal.
  Manages shell sessions behind a root-only UNIX socket at
  /var/run/modernui-console.sock. Supports up to 5 concurrent sessions
  with UUID session IDs and token-based authentication.
endef

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)/src
	$(CP) ./src/* $(PKG_BUILD_DIR)/src/
endef

define Build/Compile
	$(TARGET_CC) $(TARGET_CFLAGS) $(TARGET_LDFLAGS) \
		-o $(PKG_BUILD_DIR)/modernui-console \
		$(PKG_BUILD_DIR)/src/main.c \
		$(PKG_BUILD_DIR)/src/pty.c \
		-lutil
endef

define Package/modernui-console/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/modernui-console $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/modernui-console.init $(1)/etc/init.d/modernui-console
endef

$(eval $(call BuildPackage,modernui-console))
