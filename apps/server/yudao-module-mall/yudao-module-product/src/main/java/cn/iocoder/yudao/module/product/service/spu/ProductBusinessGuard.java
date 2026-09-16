package cn.iocoder.yudao.module.product.service.spu;

/** Optional domain extensions can reserve stable product identities without a product -> domain dependency. */
public interface ProductBusinessGuard {
    void beforeCatalogMutation(Long spuId);
}
