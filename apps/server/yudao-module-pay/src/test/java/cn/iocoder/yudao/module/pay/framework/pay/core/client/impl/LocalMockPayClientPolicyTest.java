package cn.iocoder.yudao.module.pay.framework.pay.core.client.impl;

import cn.iocoder.yudao.module.pay.framework.pay.config.PayConfiguration;
import cn.iocoder.yudao.module.pay.framework.pay.core.client.PayClientFactory;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class LocalMockPayClientPolicyTest {
    @Test
    void productionCannotEnableMockByProperty() {
        MockEnvironment environment = new MockEnvironment().withProperty("yudao.pay.mock-enabled", "true");
        environment.setActiveProfiles("prod");
        PayClientFactory factory = new PayConfiguration().payClientFactory(environment);
        assertThrows(IllegalArgumentException.class, () -> factory.createOrUpdatePayClient(1L, "mock", new NonePayClientConfig()));
    }

    @Test
    void localProfileRequiresExplicitOptIn() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("foundation");
        PayClientFactory factory = new PayConfiguration().payClientFactory(environment);
        assertThrows(IllegalArgumentException.class, () -> factory.createOrUpdatePayClient(1L, "mock", new NonePayClientConfig()));
    }

    @Test
    void foundationProfileReusesOriginalMockAdapter() {
        MockEnvironment environment = new MockEnvironment().withProperty("yudao.pay.mock-enabled", "true");
        environment.setActiveProfiles("foundation");
        PayClientFactory factory = new PayConfiguration().payClientFactory(environment);
        assertEquals("MockPayClient", factory.createOrUpdatePayClient(1L, "mock", new NonePayClientConfig()).getClass().getSimpleName());
    }

    @Test
    void combinedProductionAndFoundationProfilesCannotEnableMock() {
        MockEnvironment environment = new MockEnvironment().withProperty("yudao.pay.mock-enabled", "true");
        environment.setActiveProfiles("prod", "foundation");
        PayClientFactory factory = new PayConfiguration().payClientFactory(environment);
        assertThrows(IllegalArgumentException.class, () -> factory.createOrUpdatePayClient(1L, "mock", new NonePayClientConfig()));
    }
}
